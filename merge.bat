@echo off
pushd "%~1"
SET frontend=khelper.user.js
SET background=\khelper.bg.js
SET defaultProfile=env\profiles\joyreactor.js
echo.>%frontend%
:: for \r 
for %%x in (
	"%~dp0\widget\kellyTooltip.js"  
	"%~dp0\widget\kellyTileGrid.js" 
	"%~dp0\widget\kellyImageView.js" 
	"%~dp0\lib\KellyStorageManager.js"	 
	"%~dp0\lib\kellyThreadWork.js" 
	"%~dp0\lib\kellyGrabber.js" 
	"%~dp0\lib\kellyTools.js"	
	"%~dp0\lib\kellyFavItemsHelper.js"
	"%~dp0\%defaultProfile%"
	"%~dp0\init.js"  
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

echo.>%background%
for %%x in ( "%~dp0\lib\kellyTools.js" "%~dp0\lib\KellyDispetcher.js" "%~dp0\init_bg.js" ) do (
    
    @echo.>> %background%
    @echo.>> %background%
    @echo.>> %background%
    @echo //%%~x>> %background%
    @echo.>> %background%
    @echo.>> %background%
    @echo.>> %background%
    
    copy %background% + "%%~x" %background%
)

:: copy tmp.js + "%%~x" tmp.js > NUL
popd

:: java -jar "D:\Dropbox\Private\l scripts\jfav\jsmin\closure.jar" --js %frontend% --js_output_file khelper.user.min.js

pause