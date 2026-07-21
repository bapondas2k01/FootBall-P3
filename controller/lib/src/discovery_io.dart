import 'dart:async';
import 'dart:convert';
import 'dart:io';

class DiscoveryService {
  RawDatagramSocket? _udpSocket;

  Future<void> start(void Function(String host) onDiscovered) async {
    _udpSocket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 41234);
    _udpSocket?.broadcastEnabled = true;
    _udpSocket?.listen((RawSocketEvent event) {
      if (event == RawSocketEvent.read) {
        final dg = _udpSocket?.receive();
        if (dg != null) {
          final message = utf8.decode(dg.data);
          if (message.startsWith('FOOTBALL_GAME_SERVER:')) {
            final parts = message.split(':');
            if (parts.length >= 3) {
              final ip = parts[1];
              final port = parts[2];
              onDiscovered('http://$ip:$port');
            }
          }
        }
      }
    });
  }

  Future<void> stop() async {
    _udpSocket?.close();
    _udpSocket = null;
  }
}
