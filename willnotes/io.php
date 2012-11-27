<?php
include('authenticate.php');
/*
TODO:
- Take a versions number when saving - if conflict, return error code & json. Frontend can merge.
- User login, secure password, required for accessing data
- User subscribes to personal set of lists, need quick UI for subscribing to public lists
- Make occasional backup, daily copy (if different) put in a zip. Maybe just the diff, to save space.

*/

function filenameToPath($name) {
	return $filepath = 'data/'.$name.'.json';
}

function fail_login() {
	echo '{ "status":"ERROR", "message":"Login failed. The page will now refresh so you can log in again." }';
	exit;
}

//Read: read json from notes file and output it
if(isset($_POST['a']) && $_POST['a'] == 'read') {
	if(validate_login($_POST['logon_username'], $_POST['logon_expiry'], $_POST['logon_token'])) {
		$filepath = filenameToPath($_POST['file']);
		if (!file_exists($filepath)) {
			$fileHandle = fopen($filepath, 'w') or die("can't open new list json file");
			fwrite($fileHandle, '{"lists":[]}');
			fclose($fileHandle);
		}
		header('Content-Description: File Transfer');
		header('Content-Type: application/octet-stream');
		header('Content-Disposition: attachment; filename='.basename($filepath));
		header('Content-Transfer-Encoding: binary');
		header('Expires: 0');
		header('Cache-Control: must-revalidate');
		header('Pragma: public');
		header('Content-Length: ' . filesize($filepath));
		ob_clean();
		flush();
		readfile($filepath);
		exit;
	} else {
		fail_login();
	}
}

//Save: overwrite json file with sent data
if(isset($_POST['a']) && $_POST['a'] == 'save') {
	if(validate_login($_POST['logon_username'], $_POST['logon_expiry'], $_POST['logon_token'])) {
		$filepath = filenameToPath($_POST['file']);
		if(file_exists($filepath)) {
			if(!empty($_POST['data'])) {
				//Quotes may be encoded by JS before sent
				$dataToWrite = str_replace("\\", '', $_POST['data']);

				//Modified time
				$data_as_json_arr = json_decode($dataToWrite, true);
				//If modified time exists on incoming data, and it is older than the current modified time, error out
				//TODO: Extract modified time from JSON in old file - no guarantee time() and filemtime() match up!
				if(isset($data_as_json_arr['lastModified']) && $data_as_json_arr['lastModified'] < filemtime($filepath)) {
					die('{"status":"CONFLICT", "message":"FILE HAS BEEN UPDATED SINCE THEN"}');
				}
				//Otherwise, set new time and carry on
				$data_as_json_arr['lastModified'] = time();
				$dataToWrite = json_encode($data_as_json_arr);

				//Quick sanity check
				if(strlen($dataToWrite) < 6) {
					die('{"status":"ERROR", "message":"DATA IS EMPTY - IS THIS CORRECT?"}');
				}

				//Write data
				$fileHandle = fopen($filepath, 'w') or die('{"status":"ERROR", "message":"CANNOT OPEN FILE"}');
				fwrite($fileHandle, $dataToWrite);
				fclose($fileHandle);
			}
			echo '{"status":"OK", "lastModified":'.time().'}';
			//TODO: Successful save? Scan the file for all image references and tidy up any that don't exist any more.
			//Do this threaded, if possible? Not usre if it is on a PHP server!
		} else {
			echo '{"status":"ERROR", "message":"FILE NOT FOUND"}';
		}
		exit;
	} else {
		fail_login();
	}
}

if(isset($_POST['a']) && $_POST['a'] == 'last-modified') {
	if(validate_login($_POST['logon_username'], $_POST['logon_expiry'], $_POST['logon_token'])) {
		$filepath = filenameToPath($_POST['file']);
		if(file_exists($filepath)) {
			$mod_time = filemtime($filepath);
			if($mod_time) {
				echo '{"status":"OK", "lastModified":'.$mod_time.'}';
			} else {
				echo '{"status":"ERROR", "message":"CANNOT GET FILE MOD TIME"}';
			}
		} else {
			echo '{"status":"ERROR", "message":"FILE NOT FOUND"}';
		}
		exit;
	} else {
		fail_login();
	}
}

return '{"status":"ERROR", "message": "Unknown!"}';