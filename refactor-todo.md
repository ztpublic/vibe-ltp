# React Chatbot Kit Refactor TODOs

- 
- 
- Decorators/feedback: extend `IMessage`/`IMessageOptions` and message creators with optional decorators, actions/feedback options, timestamps/status; render via configurable footer/side slots.
- Typing/state hygiene: make `customStyles` optional/typed, replace `any` in messages/state with a `ChatMessage` type, and type `setState` shape so new metadata is safe to add.
- Build artifacts: regenerate `.d.ts` to match source and drop stale `decorator` exports (or implement them) to avoid consumer mismatch.
- Reply scroll coverage: register bot messages in `messageRegistry` with stable ids so reply-to can scroll/highlight any message type.
- Avatars: replace fixed bot avatar markup with a prop-driven default that supports images/initials and sizing/color overrides without CSS hacks.
- Loading control: make auto-dismiss of loading configurable per message (or globally) so spinners can persist until explicit completion/feedback.
