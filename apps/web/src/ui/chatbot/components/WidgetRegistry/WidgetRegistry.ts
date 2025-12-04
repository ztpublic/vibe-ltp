import React from 'react';

import { getObject } from '../Chatbot/utils';
import type { IChatState } from '../../interfaces/IMessages';
import type IWidget from '../../interfaces/IWidget';

type WidgetEntry = IWidget & {
  parentProps?: Record<string, unknown>;
};

class WidgetRegistry {
  private setState: React.Dispatch<React.SetStateAction<IChatState>>;
  private actionProvider: any;
  private registry: Record<string, WidgetEntry> = {};

  constructor(
    setStateFunc: React.Dispatch<React.SetStateAction<IChatState>>,
    actionProvider?: any
  ) {
    this.setState = setStateFunc;
    this.actionProvider = actionProvider;
  }

  addWidget = (
    { widgetName, widgetFunc, mapStateToProps, props }: IWidget,
    parentProps?: Record<string, unknown>
  ) => {
    this.registry[widgetName] = {
      widgetName,
      widgetFunc,
      mapStateToProps,
      props,
      parentProps: parentProps ? { ...parentProps } : {},
    };
  };

  getWidget = (widgetName: string, options: any) => {
    const widgetObject = this.registry[widgetName];
    if (!widgetObject) return null;

    const props = {
      scrollIntoView: options.scrollIntoView,
      ...widgetObject.parentProps,
      ...getObject(widgetObject.props),
      ...this.mapStateToProps(widgetObject.mapStateToProps, options),
      setState: this.setState,
      actionProvider: this.actionProvider || options.actions,
      actions: options.actions,
      state: options,
      payload: options.payload,
    };

    const widget = widgetObject.widgetFunc(props);
    return widget || null;
  };

  mapStateToProps = (props: string[] | undefined, state: Record<string, any>) => {
    if (!props) return {};

    return props.reduce((acc, prop) => {
      acc[prop] = state[prop];
      return acc;
    }, {} as Record<string, unknown>);
  };
}

export default WidgetRegistry;
