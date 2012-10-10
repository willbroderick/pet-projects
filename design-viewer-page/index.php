<!DOCTYPE html>
<html>
<head>
<title>Design viewer</title>
<meta charset="UTF-8" />
</head>
<body>

<?php
//Simple page viewer to show off designs written by WILL
//Just plonk it in the root of your site, and surround it with images. They will display in alphabetical order AS IF BY VOODOO MAGICK.

$page_filename = 'index.php';

function getDirectoryList ($directory) {
	$results = array();
	$handler = opendir($directory);
	while ($file = readdir($handler)) {
		if ($file != "." && $file != "..") {
			$results[] = $file;
		}
	}
	closedir($handler);
	return $results;
}

$filenames = getDirectoryList('.');

sort($filenames, SORT_STRING);

$indexToShow = 0;
if(isset($_GET['toshow'])) {
	$indexToShow = intval($_GET['toshow']);
}
$counter = 0;

$image = false;
foreach ($filenames as $value) {
	if($counter >= $indexToShow && $value !== $page_filename) { //Add any file exclusions here (e.g. tiled images or other html pages)
		$size = getimagesize($value);
		$image = array( 'filename' => $value, 'width' => $size[0], 'height' => $size[1] );
		break;
	}
	$counter++;
}
if(!$image) {
	$firstimgfile = $filenames[0] == $page_filename ? $filenames[1] : $filenames[0];
	$size = getimagesize($firstimgfile);
	$image = array( 'filename' => $firstimgfile, 'width' => $size[0], 'height' => $size[1] );
	$counter = 1;
}

$counter++;

?>

<style type="text/css">
body {
	background:#fff center top repeat;
	padding:0;
	margin:0;
}
#fullpagewrap {
	background:url('<?php echo $image['filename'] ?>') transparent center top no-repeat;
}
#contentwrap {
	width:960px;
	margin: 0 auto;
	height:<?php echo $image['height'] ?>px;
}
a {
	text-decoration:none;
}
</style>

<div id="fullpagewrap">
	
	<?php
	//This is 2 because the counter counts this file too
	if(count($filenames) > 2) {
		echo '<a href="'.$page_filename.'?toshow=' . $counter . '"><div id="contentwrap">&nbsp;</div></a>';
	} elseif ($counter == 2) {
		echo '<div id="contentwrap">&nbsp;</div>';
	} else {
		echo 'no image files!';
	}
	?>

</div>

</body>
</html>