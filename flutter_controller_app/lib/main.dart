import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

void main() {
  runApp(FootballControllerApp());
}

class FootballControllerApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Football Controller',
      theme: ThemeData.dark().copyWith(
        primaryColor: Colors.cyan,
        scaffoldBackgroundColor: Color(0xFF0F1724),
      ),
      home: HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final TextEditingController _hostController =
      TextEditingController(text: 'Searching...');
  String _mode = '1v1';
  WebSocketChannel? _channel;
  bool _wsConnected = false;
  String? _wsError;
  RawDatagramSocket? _udpSocket;

  @override
  void initState() {
    super.initState();
    _startDiscovery();
  }

  void _startDiscovery() async {
    try {
      _udpSocket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 41234);
      _udpSocket?.broadcastEnabled = true;
      _udpSocket?.listen((RawSocketEvent event) {
        if (event == RawSocketEvent.read) {
          Datagram? dg = _udpSocket?.receive();
          if (dg != null) {
            String message = utf8.decode(dg.data);
            if (message.startsWith('FOOTBALL_GAME_SERVER:')) {
              List<String> parts = message.split(':');
              if (parts.length >= 3) {
                String ip = parts[1];
                String port = parts[2];
                String fullHost = 'http://$ip:$port';
                
                if (_hostController.text != fullHost && !_wsConnected) {
                  setState(() {
                    _hostController.text = fullHost;
                  });
                  connectWebSocket();
                }
              }
            }
          }
        }
      });
    } catch (e) {
      setState(() {
        _wsError = "Discovery error: $e";
      });
    }
  }

  Uri _buildUri(String host, String action, bool value) {
    final uri = Uri.parse('$host/api/controller-state')
        .replace(queryParameters: {'action': action, 'value': value ? '1' : '0'});
    return uri;
  }

  Future<void> sendPress(String action, bool value) async {
    final host = _hostController.text.trim();
    if (host.isEmpty || host == 'Searching...') return;
    
    if (_wsConnected && _channel != null) {
      try {
        _channel!.sink.add(jsonEncode({'action': action, 'value': value}));
        return;
      } catch (e) {
        // fallback
      }
    }

    final uri = _buildUri(host, action, value);
    try {
      await http.get(uri).timeout(Duration(seconds: 2));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Network error sending $action'),
          duration: Duration(seconds: 1),
        ));
      }
    }
  }

  void connectWebSocket() {
    final host = _hostController.text.trim();
    if (host.isEmpty || host == 'Searching...') return;

    String wsHost = host;
    if (wsHost.startsWith('http://')) {
      wsHost = wsHost.replaceFirst('http://', 'ws://');
    } else if (wsHost.startsWith('https://')) {
      wsHost = wsHost.replaceFirst('https://', 'wss://');
    } else if (!wsHost.startsWith('ws://') && !wsHost.startsWith('wss://')) {
      wsHost = 'ws://$wsHost';
    }

    final uri = Uri.parse(wsHost).replace(path: '/ws/controller');

    try {
      setState(() {
        _wsError = null;
      });
      _channel?.sink.close();
      _channel = IOWebSocketChannel.connect(uri.toString());
      
      _channel!.stream.listen((message) {
        if (!_wsConnected) {
          setState(() {
            _wsConnected = true;
          });
        }
      }, onDone: () {
        setState(() {
          _wsConnected = false;
          _wsError = 'WebSocket closed';
        });
      }, onError: (err) {
        setState(() {
          _wsConnected = false;
          _wsError = 'WebSocket error';
        });
      });
    } catch (e) {
      setState(() {
        _wsConnected = false;
        _wsError = 'Connect failed';
      });
    }
  }

  void openPlayerController(int player) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PlayerControllerScreen(
          hostController: _hostController,
          player: player,
          mode: _mode,
          sendPress: sendPress,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _udpSocket?.close();
    _channel?.sink.close();
    _hostController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Football Controller'),
        elevation: 0,
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              color: Color(0xFF142030),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Game Status', style: TextStyle(fontWeight: FontWeight.bold)),
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _wsConnected ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _wsConnected ? 'CONNECTED' : 'SEARCHING...',
                            style: TextStyle(
                              color: _wsConnected ? Colors.green : Colors.redAccent,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    TextField(
                      controller: _hostController,
                      decoration: InputDecoration(
                        border: OutlineInputBorder(),
                        labelText: 'Server Address',
                        prefixIcon: Icon(Icons.lan),
                      ),
                      onEditingComplete: () => connectWebSocket(),
                    ),
                    SizedBox(height: 8),
                    Text('Game Mode', style: TextStyle(fontWeight: FontWeight.bold)),
                    DropdownButton<String>(
                      isExpanded: true,
                      value: _mode,
                      items: ['1v1', '1vAI']
                          .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                          .toList(),
                      onChanged: (v) => setState(() {
                        _mode = v ?? '1v1';
                      }),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 16),
            if (_wsError != null && !_wsConnected) ...[
              Text(_wsError!, style: TextStyle(color: Colors.redAccent, fontSize: 12)),
              SizedBox(height: 8),
            ],
            Expanded(
              child: ListView(
                children: [
                  GestureDetector(
                    onTap: () => openPlayerController(1),
                    child: Container(
                      margin: EdgeInsets.only(bottom: 12),
                      padding: EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [Color(0xFF78D1FF), Color(0xFF66B3FF)]),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 4))],
                      ),
                      child: ListTile(
                        leading: CircleAvatar(backgroundColor: Colors.white24, child: Icon(Icons.person, color: Colors.white)),
                        title: Text('Player 1', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                        subtitle: Text('Main Controller', style: TextStyle(color: Colors.white70)),
                        trailing: Icon(Icons.arrow_forward_ios, color: Colors.white),
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => openPlayerController(2),
                    child: Container(
                      padding: EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [Color(0xFFFFC88A), Color(0xFFEEA86B)]),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 4))],
                      ),
                      child: ListTile(
                        leading: CircleAvatar(backgroundColor: Colors.white24, child: Icon(Icons.person_outline, color: Colors.white)),
                        title: Text('Player 2', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                        subtitle: Text('Secondary Controller', style: TextStyle(color: Colors.white70)),
                        trailing: Icon(Icons.arrow_forward_ios, color: Colors.white),
                      ),
                    ),
                  ),
                  SizedBox(height: 20),
                  Center(
                    child: Text(
                      'Make sure both devices are on the same Wi-Fi',
                      style: TextStyle(color: Colors.white38, fontSize: 12),
                    ),
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}

class PlayerControllerScreen extends StatelessWidget {
  final TextEditingController hostController;
  final int player;
  final String mode;
  final Future<void> Function(String action, bool value) sendPress;

  PlayerControllerScreen({required this.hostController, required this.player, required this.mode, required this.sendPress});

  Widget _buildButton(String label, String action, Color color, IconData icon) {
    return Listener(
      onPointerDown: (_) => sendPress(action, true),
      onPointerUp: (_) => sendPress(action, false),
      onPointerCancel: (_) => sendPress(action, false),
      child: Container(
        height: 80,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: color, 
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white),
            SizedBox(height: 4),
            Text(label, style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Player $player Controller')),
      body: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          children: [
            Text('Connected to: ${hostController.text}', style: TextStyle(color: Colors.white38, fontSize: 12)),
            SizedBox(height: 32),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildButton('JUMP', 'up', Colors.teal, Icons.arrow_upward),
                  Row(
                    children: [
                      Expanded(child: _buildButton('LEFT', 'left', Colors.blueAccent, Icons.arrow_back)),
                      SizedBox(width: 16),
                      Expanded(child: _buildButton('RIGHT', 'right', Colors.blueAccent, Icons.arrow_forward)),
                    ],
                  ),
                  _buildButton('SLIDE', 'down', Colors.indigo, Icons.arrow_downward),
                  _buildButton('KICK', 'kick', Colors.orange, Icons.sports_soccer),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
