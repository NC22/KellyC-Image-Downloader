@echo off
pushd "%~1"

SET frontend=kmerged.user.js
SET background=kmerged.bg.js
SET manifest=manifest.json

SET recorder=1
SET joyreactor=1

SET manifestVersion=2

:: manifest configurations - all | recorder | joyreactor (see lib\manifest)

SET manifestMode=all

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
) do (
    
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo // EXTRACTED FROM FILE %%~x>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    
    copy %frontend% + "%~dp0\%%~x" %frontend%
)

break>%background%
copy %background% + "%~dp0\SIGN" %background%

for %%x in ( 
    "lib\kellyTools.js" 
    "lib\kellyDispetcher.js" 
) do (
    
    @echo.>> %background%
    @echo // EXTRACTED FROM FILE %%~x>> %background%
    @echo.>> %background%
    
    copy %background% + "%~dp0\%%~x" %background%
)

if "%manifestVersion%" equ "3" (

    @echo.>> %background%    
    copy %background% + "%~dp0\lib\kellyDispetcherNetRequest.js" %background%
    @echo.>> %background%  
    
)

@echo.>> %background%
copy %background% + "env\init\background.js" %background%
@echo.>> %background%

if "%joyreactor%" geq "1" (

    for %%x in (
        "lib\profiles\joyreactor.js" 
        "lib\profiles\joyreactor.unlock.js"
        "lib\profiles\topjoyreactor.js" 
    ) do (
    
        @echo.>> %frontend%
        @echo // EXTRACTED FROM FILE %%~x>> %frontend%
        @echo.>> %frontend%
        
        copy %frontend% + "%~dp0\%%~x" %frontend%
    )
)

@echo.>> %frontend%
@echo.>> %frontend%

if "%recorder%" geq "1" (

    for %%x in (
        "lib\recorder\kellyPageWatchdog.js"	  
        "lib\recorder\kellyLoadDocControll.js"      
        "lib\recorder\kellyDPage.js"
        "lib\recorder\filters\*.js"
        "lib\profiles\default.js" 
        "lib\profiles\recorder.js" 
    ) do (
    
        @echo.>> %frontend%
        @echo // EXTRACTED FROM FILE %%~x>> %frontend%
        @echo.>> %frontend%
        
        copy %frontend% + "%~dp0\%%~x" %frontend%
    )
    
    @echo.>> %background%    
    copy %background% + "%~dp0\lib\recorder\kellyEDRecorder.js" %background%
    @echo.>> %background%  
)

@echo.>> %frontend%
@echo.>> %frontend%

break>%manifest%

if "%manifestVersion%" equ "3" (

    copy "%~dp0\lib\manifest\manifest_%manifestMode%_v3.json" %manifest%
    
) else (
    copy "%~dp0\lib\manifest\manifest_%manifestMode%.json" %manifest%
)


popd

:: optional minification, jsMin required
:: java -jar "D:\Dropbox\Private\l scripts\jfav\jsmin\closure.jar" --js %frontend% --js_output_file khelper.user.min.js

:: pause