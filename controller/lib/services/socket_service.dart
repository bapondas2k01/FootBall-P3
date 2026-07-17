import 'dart:async';
import 'dart:convert';
import 'dart:io';

class WebSocketService {
  WebSocket? _socket;
  final StreamController<Map<String, dynamic>> _messageController =
      StreamController.broadcast();
  final StreamController<bool> _connectionController =
      StreamController.broadcast();

  Stream<Map<String, dynamic>> get messages => _messageController.stream;
  Stream<bool> get connectionState => _connectionController.stream;

  Future<void> connect(String address) async {
    final wsUrl = _toWebSocketUrl(address);
    _connectionController.add(false);

    try {
      // Connect with a 5 second timeout
      _socket = await WebSocket.connect(wsUrl).timeout(const Duration(seconds: 5));
      _connectionController.add(true);
      
      _socket?.listen(
        (event) {
          if (event is String) {
            try {
              final jsonValue = json.decode(event);
              if (jsonValue is Map<String, dynamic>) {
                _messageController.add(jsonValue);
              }
            } catch (_) {
              _messageController.add({'raw': event});
            }
          }
        },
        onDone: () {
          _connectionController.add(false);
          _socket = null;
        },
        onError: (_) {
          _connectionController.add(false);
          _socket = null;
        },
        cancelOnError: true,
      );
    } catch (error) {
      _connectionController.add(false);
      rethrow;
    }
  }

  Future<void> reconnect(String address) async {
    await close();
    await connect(address);
  }

  bool get isConnected => _socket?.readyState == WebSocket.open;

  void sendEvent(String type, Map<String, dynamic> payload) {
    if (!isConnected || _socket == null) {
      return;
    }

    final message = json.encode({
      'action': payload['button'] ?? payload['axis'] ?? type,
      'value': payload['action'] == 'press' || (payload['value'] ?? 0) > 0,
      'player': payload['player'],
    });
    _socket?.add(message);
  }

  void sendButtonEvent({
    required String player,
    required String button,
    required String action,
    required bool isLongPress,
  }) {
    // Map the button names to match what the Vite server/Game expects
    String gameAction = button.toLowerCase();
    if (gameAction == 'l') gameAction = 'left';
    if (gameAction == 'r') gameAction = 'right';
    if (gameAction == 'jump') gameAction = 'up';
    if (gameAction == 'kick') gameAction = 'kick';

    sendEvent('controller_button', {
      'player': player,
      'button': gameAction,
      'action': action,
      'longPress': isLongPress,
    });
  }

  void sendAnalogEvent({
    required String player,
    required String axis,
    required double value,
  }) {
    sendEvent('controller_analog', {
      'player': player,
      'axis': axis,
      'value': value,
    });
  }

  Future<void> close() async {
    await _socket?.close(WebSocketStatus.normalClosure);
    _socket = null;
    _connectionController.add(false);
  }

  String _toWebSocketUrl(String address) {
    String normalized = address.trim();
    
    // Remove trailing slash
    if (normalized.endsWith('/')) {
      normalized = normalized.substring(0, normalized.length - 1);
    }

    // Convert http to ws
    if (normalized.startsWith('http://')) {
      normalized = normalized.replaceFirst('http://', 'ws://');
    } else if (normalized.startsWith('https://')) {
      normalized = normalized.replaceFirst('https://', 'wss://');
    } else if (!normalized.startsWith('ws://') && !normalized.startsWith('wss://')) {
      normalized = 'ws://$normalized';
    }

    // Ensure the path /ws/controller is present
    if (!normalized.contains('/ws/controller')) {
      normalized = '$normalized/ws/controller';
    }

    return normalized;
  }
}
