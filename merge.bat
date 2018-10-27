@echo off
pushd "%~1"
SET frontend=khelper.user.js
SET background=khelper.bg.js
SET defaultProfile=env\profiles\joyreactor.js
SET debug=0

echo.>%frontend%

:: for \r 
for %%x in (
	"%~dp0\widget\kellyTooltip.js"  
	"%~dp0\widget\kellyTileGrid.js" 
	"%~dp0\widget\kellyImageView.js" 
	"%~dp0\lib\kellyLoc.js"	
	"%~dp0\lib\kellyStorageManager.js"	 
	"%~dp0\lib\kellyThreadWork.js" 
	"%~dp0\lib\kellyGrabber.js" 
    "%~dp0\lib\kellyFastSave.js" 
	"%~dp0\lib\kellyTools.js"
    "%~dp0\lib\kellyOptions.js"
	"%~dp0\lib\kellyFavItems.js"
	"%~dp0\%defaultProfile%"  
) do (

    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo //%%~x>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    
    copy %frontend% + "%%~x" %frontend%
)

@echo // initialization>> %frontend%

@echo.>> %frontend%
IF "%debug%" GEQ "1" (
    @echo KellyTools.DEBUG = true;>> %frontend%
)
@echo.>> %frontend%

copy %frontend% + "%~dp0\init.js" %frontend%

@echo.>> %frontend%
@echo // end of file >> %frontend%

echo.>%background%
for %%x in ( 
    "%~dp0\lib\kellyTools.js" 
    "%~dp0\lib\kellyDispetcher.js" 
) do (
    
    @echo.>> %background%
    @echo.>> %background%
    @echo.>> %background%
    @echo //%%~x>> %background%
    @echo.>> %background%
    @echo.>> %background%
    @echo.>> %background%
    
    copy %background% + "%%~x" %background%
)

@echo // initialization>> %background%

@echo.>> %background%
IF "%debug%" GEQ "1" (
    @echo KellyTools.DEBUG = true;>> %background%
)
@echo.>> %background%

copy %background% + "%~dp0\init.bg.js" %background%

@echo.>> %background%
@echo // end of file >> %background%

:: copy tmp.js + "%%~x" tmp.js > NUL
popd

:: java -jar "D:\Dropbox\Private\l scripts\jfav\jsmin\closure.jar" --js %frontend% --js_output_file khelper.user.min.js

:: pause