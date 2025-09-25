@ECHO OFF
SETLOCAL

SET DIR=%~dp0
SET WRAPPER_JAR=%DIR%gradle\wrapper\gradle-wrapper.jar

IF NOT EXIST "%WRAPPER_JAR%" (
  ECHO Wrapper JAR not found. Please run: gradle wrapper
  EXIT /B 1
)

SET JAVA_EXE=java
"%JAVA_EXE%" -Dorg.gradle.appname=gradlew -classpath "%WRAPPER_JAR%" org.gradle.wrapper.GradleWrapperMain %*


