import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

class WebSocketService {
  final StreamController<bool> _connectionController =
      StreamController.broadcast();
  String? _baseUrl;

  Stream<bool> get connectionState => _connectionController.stream;

  Future<void> connect(String address) async {
    _baseUrl = _normalizeAddress(address);
    _connectionController.add(false);

    try {
      final response = await http
          .get(Uri.parse('$_baseUrl/api/state'))
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        _connectionController.add(true);
      } else {
        throw Exception('Server returned ${response.statusCode}');
      }
    } catch (error) {
      _connectionController.add(false);
      rethrow;
    }
  }

  Future<void> reconnect(String address) async {
    await close();
    await connect(address);
  }

  bool get isConnected => _baseUrl != null;

  Future<void> sendButtonEvent({
    required String player,
    required String button,
    required String action,
    required bool isLongPress,
  }) async {
    if (_baseUrl == null) {
      return;
    }

    final gameAction = _normalizeAction(button);
    final normalizedPlayer = _normalizePlayer(player);
    final payload = json.encode({
      'player': normalizedPlayer,
      'action': gameAction,
      'value': action == 'press',
    });

    try {
      await http.post(
        Uri.parse('$_baseUrl/api/controls'),
        headers: {'Content-Type': 'application/json'},
        body: payload,
      );
    } catch (_) {}
  }

  Future<void> close() async {
    _baseUrl = null;
    _connectionController.add(false);
  }

  String _normalizeAddress(String address) {
    String normalized = address.trim();
    if (normalized.endsWith('/')) {
      normalized = normalized.substring(0, normalized.length - 1);
    }
    if (!normalized.startsWith('http://') &&
        !normalized.startsWith('https://')) {
      normalized = 'http://$normalized';
    }
    return normalized;
  }

  String _normalizePlayer(String player) {
    final normalized = player.toLowerCase();
    if (normalized == 'p2' ||
        normalized == 'player2' ||
        normalized == 'player-2' ||
        normalized == '2') {
      return 'p2';
    }
    return 'p1';
  }

  String _normalizeAction(String button) {
    final normalized = button.toLowerCase();
    if (normalized == 'l' || normalized == 'left') return 'left';
    if (normalized == 'r' || normalized == 'right') return 'right';
    if (normalized == 'jump') return 'jump';
    if (normalized == 'slide' || normalized == 'down') return 'slide';
    if (normalized == 'kick') return 'kick';
    return normalized;
  }
}
