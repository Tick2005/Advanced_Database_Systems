@ECHO OFF
SETLOCAL

SET "MAVEN_PROJECTBASEDIR=%~dp0"
IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

IF EXIST "%ProgramFiles%\Java\jdk-21\bin\javac.exe" (
	SET "JAVA_HOME=%ProgramFiles%\Java\jdk-21"
	SET "PATH=%JAVA_HOME%\bin;%PATH%"
)

SET "MAVEN_BOOTSTRAP_VERSION=3.9.9"
SET "MAVEN_BOOTSTRAP_DIR=%LOCALAPPDATA%\maven-wrapper\apache-maven-%MAVEN_BOOTSTRAP_VERSION%"
SET "MAVEN_BOOTSTRAP_ZIP=%LOCALAPPDATA%\maven-wrapper\apache-maven-%MAVEN_BOOTSTRAP_VERSION%-bin.zip"
SET "MAVEN_BOOTSTRAP_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_BOOTSTRAP_VERSION%/apache-maven-%MAVEN_BOOTSTRAP_VERSION%-bin.zip"

IF EXIST "%MAVEN_BOOTSTRAP_DIR%\bin\mvn.cmd" (
	"%MAVEN_BOOTSTRAP_DIR%\bin\mvn.cmd" %*
	EXIT /B %ERRORLEVEL%
)

IF NOT EXIST "%LOCALAPPDATA%\maven-wrapper" MKDIR "%LOCALAPPDATA%\maven-wrapper"

ECHO Downloading Maven %MAVEN_BOOTSTRAP_VERSION%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%MAVEN_BOOTSTRAP_URL%' -OutFile '%MAVEN_BOOTSTRAP_ZIP%'"
IF ERRORLEVEL 1 (
	ECHO Failed to download Maven from %MAVEN_BOOTSTRAP_URL%
	EXIT /B 1
)

IF EXIST "%MAVEN_BOOTSTRAP_DIR%" RMDIR /S /Q "%MAVEN_BOOTSTRAP_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%MAVEN_BOOTSTRAP_ZIP%' -DestinationPath '%LOCALAPPDATA%\maven-wrapper' -Force"
IF ERRORLEVEL 1 (
	ECHO Failed to extract Maven bootstrap archive.
	EXIT /B 1
)

IF NOT EXIST "%MAVEN_BOOTSTRAP_DIR%\bin\mvn.cmd" (
	ECHO Maven bootstrap failed: "%MAVEN_BOOTSTRAP_DIR%\bin\mvn.cmd" not found.
	EXIT /B 1
)

"%MAVEN_BOOTSTRAP_DIR%\bin\mvn.cmd" %*

ENDLOCAL
