<?php

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

//Read: read json from notes file and output it
if(isset($_GET['a']) && $_GET['a'] == 'read') {
	$filepath = filenameToPath($_GET['file']);
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
}

//Save: overwrite json file with sent data
if(isset($_POST['a']) && $_POST['a'] == 'save') {
	$filepath = filenameToPath($_POST['file']);
	if(file_exists($filepath)) {
		if(!empty($_POST['data'])) {
			$dataToWrite = str_replace("\\", '', $_POST['data']);
			$fileHandle = fopen($filepath, 'w') or die('{"status":"CANNOT OPEN FILE"}');
			fwrite($fileHandle, $dataToWrite);
			fclose($fileHandle);
		}
		echo '{"status":"OK"}';
	} else {
		echo '{"status":"FILE NOT FOUND"}';
	}
	exit;
}

return '{"status":"error"}';