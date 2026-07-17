import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import '../models/controller_mode.dart';
import '../widgets/player_card.dart';
import 'controller_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _ipController = TextEditingController(
    text: 'Searching for game...',
  );
  ControllerMode _selectedMode = ControllerMode.oneVOne;
  RawDatagramSocket? _udpSocket;
  bool _isAutoConnected = false;

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
                
                if (_ipController.text != fullHost && !_isAutoConnected) {
                  setState(() {
                    _ipController.text = fullHost;
                    _isAutoConnected = true;
                  });
                }
              }
            }
          }
        }
      });
    } catch (e) {
      debugPrint("Discovery error: $e");
    }
  }

  @override
  void dispose() {
    _udpSocket?.close();
    _ipController.dispose();
    super.dispose();
  }

  void _openController(String player) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ControllerScreen(
          gameAddress: _ipController.text.trim(),
          selectedMode: _selectedMode,
          player: player,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cardSpacing = 16.0;
    final backgroundColor = const Color(0xFF0F172A);
    final sectionColor = const Color(0xFF111827);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Football Controller',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_isAutoConnected)
                    const Icon(Icons.wifi, color: Colors.green, size: 24)
                  else
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white24),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'The app is searching for your game automatically. Ensure both are on the same Wi-Fi.',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              Container(
                decoration: BoxDecoration(
                  color: sectionColor,
                  borderRadius: BorderRadius.circular(24),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 20,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Game IP Address',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _ipController,
                      style: const TextStyle(color: Colors.white, fontSize: 16),
                      cursorColor: Colors.white,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFF1F2937),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        hintText: 'Searching...',
                        hintStyle: const TextStyle(
                          color: Color.fromRGBO(255, 255, 255, 0.5),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Container(
                decoration: BoxDecoration(
                  color: sectionColor,
                  borderRadius: BorderRadius.circular(24),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 20,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Selected Mode',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFF374151)),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 16,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _selectedMode.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFF1F2937),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<ControllerMode>(
                                dropdownColor: const Color(0xFF0F172A),
                                value: _selectedMode,
                                icon: const Icon(
                                  Icons.keyboard_arrow_down,
                                  color: Colors.white70,
                                ),
                                items: ControllerMode.values.map((mode) {
                                  return DropdownMenuItem(
                                    value: mode,
                                    child: Text(
                                      mode.title,
                                      style: const TextStyle(
                                        color: Colors.white,
                                      ),
                                    ),
                                  );
                                }).toList(),
                                onChanged: (mode) {
                                  if (mode != null) {
                                    setState(() {
                                      _selectedMode = mode;
                                    });
                                  }
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Expanded(
                child: ListView(
                  physics: const BouncingScrollPhysics(),
                  children: [
                    PlayerCard(
                      title: 'Player 1',
                      subtitle: 'Open the portrait controller for Player 1',
                      startColor: const Color(0xFF4F46E5),
                      endColor: const Color(0xFF22D3EE),
                      icon: Icons.sports_soccer,
                      onTap: () => _openController('player1'),
                    ),
                    if (_selectedMode != ControllerMode.oneVAI) ...[
                      SizedBox(height: cardSpacing),
                      PlayerCard(
                        title: 'Player 2',
                        subtitle: 'Open the portrait controller for Player 2',
                        startColor: const Color(0xFFFB7185),
                        endColor: const Color(0xFFF59E0B),
                        icon: Icons.sports_soccer,
                        onTap: () => _openController('player2'),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
