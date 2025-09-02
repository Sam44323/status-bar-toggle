import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const states: { [key: string]: string } = {
    DEFAULT: "#222222", // very dark gray
    ATTACKER: "#800000", // dark red / maroon
    USER: "#4B0082", // indigo violet
    "CORRECT-EXECUTION": "#006400", // dark green
  };

  let current: keyof typeof states = "DEFAULT";

  // Create a status bar item
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  item.text = `$(person) ${current}`;
  item.tooltip = "Click to select state";
  item.command = "statusbarToggle.selectState";
  item.show();

  // Helper to update status bar background
  const updateStatusBarColor = (color: string) => {
    vscode.workspace.getConfiguration().update(
      "workbench.colorCustomizations",
      {
        "statusBar.background": color,
        "statusBar.noFolderBackground": color,
        "statusBar.debuggingBackground": color,
        "statusBar.foreground": "#FFFFFF", // ensure text is readable
      },
      vscode.ConfigurationTarget.Global
    );
  };

  // Initial color
  updateStatusBarColor(states[current]);

  // Register command to show dropdown
  const disposable = vscode.commands.registerCommand(
    "statusbarToggle.selectState",
    async () => {
      const picked = await vscode.window.showQuickPick(Object.keys(states), {
        placeHolder: "Select a state",
      });

      if (picked) {
        current = picked as keyof typeof states;
        item.text = `$(person) ${current}`;
        updateStatusBarColor(states[current]);
      }
    }
  );

  context.subscriptions.push(item);
  context.subscriptions.push(disposable);
}

export function deactivate() {}
