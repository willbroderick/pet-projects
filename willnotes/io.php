<?php

function filenameToPath($name) {
	return $filepath = 'listfiles/'.$name.'.json';
}

//Read notes file and relay it back
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