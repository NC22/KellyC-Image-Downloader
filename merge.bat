@echo off
pushd "%~1"
SET frontend=kmerged.user.js
SET background=kmerged.bg.js
SET options=kmerged.options.js

break>%frontend%
:: or echo.>%frontend% to clear file before write
copy %frontend% + "%~dp0\SIGN" %frontend%

for %%x in (
    "widget\kellyTooltip.js"  
    "widget\kellyTileGrid.js" 
    "widget\kellyImageView.js" 
    "lib\kellyLoc.js"	
    "lib\kellyStorageManager.js"	 
    "lib\kellyThreadWork.js" 
    "lib\kellyGrabber.js" 
    "lib\kellyFastSave.js" 
    "lib\kellyTools.js"
    "lib\kellyOptions.js"
    "lib\kellyFavItems.js"
    "env\profiles\joyreactor.js" 
    "env\profiles\topjoyreactor.js" 
) do (
    
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo // EXTRACTED FROM FILE %%~x>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    
    copy %frontend% + "%~dp0\%%~x" %frontend%
)

@echo.>> %frontend%
@echo.>> %frontend%
@echo.>> %frontend%
@echo // end of file >> %frontend%

break>%background%
copy %background% + "%~dp0\SIGN" %background%

for %%x in ( 
    "lib\kellyTools.js" 
    "lib\kellyDispetcher.js" 
) do (
    
    @echo.>> %background%
    @echo.>> %background%
    @echo.>> %background%
    @echo // EXTRACTED FROM FILE %%~x>> %background%
    @echo.>> %background%
    @echo.>> %background%
    @echo.>> %background%
    
    copy %background% + "%~dp0\%%~x" %background%
)

@echo.>> %background%
@echo.>> %background%
@echo.>> %background%
@echo // end of file >> %background%

break>%options%
copy %options% + "%~dp0\SIGN" %options%

for %%x in (
    "lib\kellyOptionsPage.js"  
) do (

    @echo // EXTRACTED FROM FILE %%~x>> %options%    
    copy %options% + "%~dp0\%%~x" %options%
)

@echo.>> %options%
@echo // end of file >> %options%

popd

:: optional minification, jsMin required
:: java -jar "D:\Dropbox\Private\l scripts\jfav\jsmin\closure.jar" --js %frontend% --js_output_file khelper.user.min.js

:: pause