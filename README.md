# Status Bar Toggle (Mindset-Sync)

A lightweight VS Code extension that lets you **toggle between multiple states** (`DEFAULT`, `ATTACKER`, `USER`, `CORRECT-EXECUTION`) directly from the **status bar**.  
Each state-changes both the **status bar text** and the **entire status bar color** to a darker shade for clarity.

---


### Status Bar States

**Default State**

![Default State](images/default.png)

**Attacker State**

![Attacker State](images/attacker.png)

**User State**

![User State](images/user.png)

**Correct Execution State**

![Correct Execution State](images/correct-flow.png)

### Dropdown Menu

**State Selection Dropdown**
![Dropdown Menu](images/dropdown.png)

### Command Palette

**Run Command from Palette**
![Command Palette](images/command.png)

### Current-Flow

**Current-Flow Text**

![Current-Flow Text](images/current-flow-text.png)

**Current Flow Message**

![Current-Flow Message](images/current-flow-message.png)

---

### ✨ Features

- Adds a status bar item with label and icon.
- Click the item (or run command) to open a dropdown menu.
- Select one of the following states:
  - `DEFAULT` → Dark-Gray
  - `ATTACKER` → Dark-Red
  - `USER` → Violet (Indigo)
  - `CORRECT-EXECUTION` → Dark-Green
- The **entire status bar background color** updates automatically.
- Always ensures white text for readability.
- **Add current-flow information** via a command — displays next to the state in the status bar.
- Both **state** and **flow info** are **saved** and restored on VS Code restart.
- **Dark background** per state with **white text** for readability.
- Click the status bar item or use the **Command Palette** to change states or add flow info.
- Support for multi-window state

---

### 🚀 Usage

1. Install the extension (via `.vsix` or marketplace if published).
2. Look at the **status bar** (bottom left).
3. Click the item `👤 DEFAULT` to open a dropdown menu.
4. Select one of the states → the status bar updates instantly.
5. You can also run the command from the Command Palette:

---