import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/controller_mode.dart';
import '../services/socket_service.dart';

class ControllerScreen extends StatefulWidget {
  final String gameAddress;
  final ControllerMode selectedMode;
  final String player;

  const ControllerScreen({
    super.key,
    required this.gameAddress,
    required this.selectedMode,
    required this.player,
  });

  @override
  State<ControllerScreen> createState() => _ControllerScreenState();
}

class _ControllerScreenState extends State<ControllerScreen> {
  final WebSocketService _socketService = WebSocketService();
  bool _isConnected = false;
  String _connectionMessage = 'Connecting...';

  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    _connectSocket();
    _socketService.connectionState.listen((connected) {
      if (mounted) {
        setState(() {
          _isConnected = connected;
          _connectionMessage = connected ? 'Connected' : 'Disconnected';
        });
      }
    });
  }

  @override
  void dispose() {
    _socketService.close();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    super.dispose();
  }

  Future<void> _connectSocket() async {
    try {
      await _socketService.connect(widget.gameAddress);
    } catch (e) {
      if (mounted) {
        setState(() {
          _connectionMessage = 'Error';
        });
      }
    }
  }

  void _sendButtonEvent(String button, String action) {
    final playerKey = widget.player == 'p2' || widget.player == 'player2'
        ? 'p2'
        : 'p1';
    _socketService.sendButtonEvent(
      player: playerKey,
      button: button,
      action: action,
      isLongPress: false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Stack(
          children: [
            // Status Header
            Positioned(
              top: 10,
              left: 20,
              right: 20,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Text(
                    widget.player.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _isConnected
                          ? Colors.green.withOpacity(0.2)
                          : Colors.red.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _connectionMessage,
                      style: TextStyle(
                        color: _isConnected ? Colors.green : Colors.redAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Left Side: Movement (L / R)
            Positioned(
              left: 40,
              bottom: 40,
              child: Row(
                children: [
                  _buildControlButton(
                    'left',
                    Icons.arrow_back,
                    Colors.blueGrey,
                  ),
                  const SizedBox(width: 20),
                  _buildControlButton(
                    'right',
                    Icons.arrow_forward,
                    Colors.blueGrey,
                  ),
                ],
              ),
            ),

            // Right Side: Actions (Jump, Kick, Slide)
            Positioned(
              right: 40,
              bottom: 40,
              child: Row(
                children: [
                  _buildActionButton('SLIDE', 'slide', Colors.indigoAccent),
                  const SizedBox(width: 15),
                  _buildActionButton('KICK', 'kick', Colors.orangeAccent),
                  const SizedBox(width: 15),
                  _buildActionButton('JUMP', 'jump', Colors.cyanAccent),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControlButton(String label, IconData icon, Color color) {
    return Listener(
      onPointerDown: (_) => _sendButtonEvent(label, 'press'),
      onPointerUp: (_) => _sendButtonEvent(label, 'release'),
      child: Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          color: color.withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.5), width: 2),
        ),
        child: Icon(icon, color: Colors.white, size: 32),
      ),
    );
  }

  Widget _buildActionButton(String label, String eventKey, Color color) {
    return Listener(
      onPointerDown: (_) => _sendButtonEvent(eventKey, 'press'),
      onPointerUp: (_) => _sendButtonEvent(eventKey, 'release'),
      child: Container(
        width: 90,
        height: 90,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color, color.withOpacity(0.7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.4),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
