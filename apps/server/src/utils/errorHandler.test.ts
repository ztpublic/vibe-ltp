import { describe, it, expect, vi } from 'vitest';
import { handleSocketError, sendSocketSuccess } from './errorHandler.js';

describe('Socket Error Handler', () => {
  it('should handle Error instances', () => {
    const callback = vi.fn();
    const error = new Error('Test error');
    
    handleSocketError(error, 'test context', callback);
    
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'Test error'
    });
  });

  it('should handle string errors', () => {
    const callback = vi.fn();
    handleSocketError('String error', 'test context', callback);
    
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'String error'
    });
  });

  it('should handle other error types', () => {
    const callback = vi.fn();
    handleSocketError({ message: 'Object error' }, 'test context', callback);
    
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: '[object Object]'
    });
  });

  it('should work without callback', () => {
    expect(() => handleSocketError(new Error('Test'), 'context')).not.toThrow();
  });

  it('should log error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    
    handleSocketError(error, 'test context');
    
    expect(consoleSpy).toHaveBeenCalledWith('[Socket] test context:', 'Test error');
    consoleSpy.mockRestore();
  });

  it('should send success callback', () => {
    const callback = vi.fn();
    sendSocketSuccess(callback);
    
    expect(callback).toHaveBeenCalledWith({ success: true });
  });

  it('should work without callback for sendSocketSuccess', () => {
    expect(() => sendSocketSuccess()).not.toThrow();
  });
});
