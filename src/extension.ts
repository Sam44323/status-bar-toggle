import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const states: { [key: string]: string } = {
    DEFAULT: "#444444", // dark gray
    ATTACKER: "#800000", // dark red
    USER: "#6A0DAD", // dark violet
    "CORRECT-EXECUTION": "#006400", // dark green
  };

  // Load saved state (fallback to DEFAULT)
  let current =
    context.globalState.get<string>("statusbarToggleState") || "DEFAULT";

  // Create status bar item
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  updateStatusBar(item, current, states);
  item.show();

  // Register command
  const disposable = vscode.commands.registerCommand(
    "statusbarToggle.selectState",
    async () => {
      const picked = await vscode.window.showQuickPick(Object.keys(states), {
        placeHolder: "Select a state",
      });

      if (picked) {
        current = picked;
        updateStatusBar(item, current, states);

        // persist across reloads
        await context.globalState.update("statusbarToggleState", current);

        // persist status bar background too
        const config = vscode.workspace.getConfiguration();
        config.update(
          "workbench.colorCustomizations",
          {
            "statusBar.background": states[current],
            "statusBar.noFolderBackground": states[current],
            "statusBar.debuggingBackground": states[current],
            "statusBar.foreground": "#FFFFFF", // always white text
          },
          vscode.ConfigurationTarget.Global
        );
      }
    }
  );

  context.subscriptions.push(item);
  context.subscriptions.push(disposable);
}

function updateStatusBar(
  item: vscode.StatusBarItem,
  state: string,
  states: { [key: string]: string }
) {
  item.text = `$(person) ${state}`;
  item.tooltip = `Current state: ${state}`;
  item.color = "#FFFFFF"; // always white text
}

export function deactivate() {}
