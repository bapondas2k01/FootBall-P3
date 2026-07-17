enum ControllerMode { oneVOne, oneVAI }

extension ControllerModeExtension on ControllerMode {
  String get title {
    switch (this) {
      case ControllerMode.oneVOne:
        return '1v1';
      case ControllerMode.oneVAI:
        return '1vAI';
    }
  }

  String get description {
    switch (this) {
      case ControllerMode.oneVOne:
        return 'Two-player match';
      case ControllerMode.oneVAI:
        return 'Play against AI';
    }
  }
}
