[Setup]
AppName=AI Network Monitoring Agent
AppVersion=1.0
DefaultDirName={autopf}\AI Network Monitoring Agent
DefaultGroupName=AI Network Monitoring Agent
OutputDir=Output
OutputBaseFilename=AgentInstaller
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin

[Files]
Source: "C:\Users\krrsa\Desktop\AI-Network-Monitoring-IDS\agent\dist\Agent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\krrsa\Desktop\AI-Network-Monitoring-IDS\installer\nssm.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\AI Network Monitoring Agent"; Filename: "{app}\Agent.exe"
Name: "{commondesktop}\AI Network Monitoring Agent"; Filename: "{app}\Agent.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons:"

[Run]
Filename: "{app}\nssm.exe"; \
Parameters: "install NetworkAgent ""{app}\Agent.exe"""; \
Flags: runhidden waituntilterminated

Filename: "{app}\nssm.exe"; \
Parameters: "set NetworkAgent AppDirectory ""{app}"""; \
Flags: runhidden waituntilterminated

Filename: "sc.exe"; \
Parameters: "start NetworkAgent"; \
Flags: runhidden waituntilterminated

[UninstallRun]
Filename: "sc.exe"; Parameters: "stop NetworkAgent"; Flags: runhidden waituntilterminated
Filename: "{app}\nssm.exe"; Parameters: "remove NetworkAgent confirm"; Flags: runhidden waituntilterminated