class DiscoveryService {
  Future<void> start(void Function(String host) onDiscovered) async {
    // Web build cannot perform UDP discovery.
  }

  Future<void> stop() async {
    // Nothing to close on web.
  }
}
