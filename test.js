//模块引入
var node_echarts = require('node-echarts');
var path = require('path');
var moment = require('moment');
var execSync = require('child_process').execSync;
var sleep = require('sleep').sleep;
var config = require('./config');

console.log('config:', config);

const timeStampFile = moment(Date.now()).format('YYYY-MM-DD_HH:mm:ss');

//相关shell脚本命令
const shellStartPackage = `adb shell am start ${config.packageName}/.MainActivity`;
const shellPackageExist = `adb shell ps | grep ${config.packageName}`;
const shellMemStr = `adb shell dumpsys meminfo ${config.packageName} | tee -a ${config.packageName}${timeStampFile}_memoryDetail.txt | grep -E \'TOTAL|Dalvik Heap|Native Heap\' | grep -v \'TOTAL:\' | sed 's/Heap//g' | awk 'NR!=4{print $2}'`;

var xAxisData = [];
var dalvikData = [];
var nativeData = [];
var totalData = [];

const execute = async command => {
	console.log('command:', command);
	try {
		let value = execSync(command).toString();

		console.log('value: ' + value);

		if (!value) return true;
		else return value;
	} catch (error) {
		console.log('exec error ! ', error.message);
		return false;
	}
};

const saveToImage = (imageWidth, imageHeight, imageName) => {
	let option = {
		backgroundColor: 'rgba(0,0,0,0)',
		title: {
			text: startTime + '---' + endTime,
			textStyle: {
				color: 'rgba(170, 29, 29, 1)'
			}
		},
		tooltip: {
			trigger: 'axis'
		},
		legend: {
			data: ['Dalvik', 'Native', 'Total']
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			containLabel: true
		},
		xAxis: {
			type: 'category',
			boundaryGap: false,
			data: xAxisData
		},
		yAxis: {
			type: 'value'
		},
		series: [
			{
				name: 'Dalvik',
				type: 'line',
				stack: '总量',
				data: dalvikData
			},
			{
				name: 'Native',
				type: 'line',
				stack: '总量',
				data: nativeData
			},
			{
				name: 'Total',
				type: 'line',
				stack: '总量',
				data: totalData
			}
		]
	};

	node_echarts({
		width: imageWidth, // Image width, type is number.
		height: imageHeight, // Image height, type is number.
		option: option, // Echarts configuration, type is Object.
		//If the path  is not set, return the Buffer of image.
		path: path.join(__dirname, imageName), // Path is filepath of the image which will be created.
		enableAutoDispose: true //Enable auto-dispose echarts after the image is created.
	});
};
const checkUpPackage = async () => {
	let ret = await execute(shellPackageExist);
	if (!ret) {
		console.log(' package is not exist');
		return false;
	} else return true;
};

const recordData = async () => {
	console.log('will recordData');
	let ret = null,
		spt = null;

	try {
		ret = await execute(shellMemStr);
		if (!ret) {
			console.log('execute shellMemStr error');
			return;
		}

		spt = ret.split('\n');
		console.log('data : ', spt);
		if (spt.length != 4) {
			console.log('There is a problem with the data forma');
			return;
		}
	} catch (error) {
		console.log('recordData error !');
		return;
	}

	xAxisData.push(moment(Date.now()).format('YYYY-MM-DD_HH:mm:ss'));
	dalvikData.push(spt[0]);
	nativeData.push(spt[1]);
	totalData.push(spt[2]);
};

//检查配置文件
const checkUpConfig = () => {
	if (!config) {
		console.error('No profile ！！！');
		return false;
	}

	if (!config.packageName) {
		console.error('No package name ！！！');
		return false;
	}

	if (!config.cmds || !Array.isArray(config.cmds)) {
		console.error('cmd of config error ！！！');
		return false;
	}

	return true;
};

/**
 * 获取当前时间戳(秒)
 */
const getNowSceond = () => {
	return Math.floor(Date.now() / 1000);
};

var startTime = moment(Date.now()).format('YYYY-MM-DD_HH:mm:ss');
var endTime = startTime;

//execute(shellMemStr);
var main = async () => {
	if (!checkUpConfig()) {
		return;
	}

	//start app
	let ret = await execute(shellStartPackage);
	if (!ret) {
		console.log('start package error');
		return;
	}

	let start = getNowSceond();
	let cmdCount = 0;

	//waiting
	console.log(`waiting init! ${config.initWaitingTime}s`);
	sleep(config.initWaitingTime);

	while (getNowSceond() - start <= config.runTime) {
		let ret = await checkUpPackage();
		if (!ret) break;

		let cmd = config.cmds[cmdCount];
		if (++cmdCount >= config.cmds.length) {
			cmdCount = 0;
		}
		let exec = null;
		if (cmd.type == 'touch') {
			exec = `adb shell input tap ${cmd.x} ${cmd.y}`;
		} else if (cmd.type == 'back') {
			exec = 'adb shell input keyevent KEYCODE_BACK';
		} else {
			console.log('There are no matching commands！');
			continue;
		}

		ret = await execute(exec);
		if (!ret) {
			console.log(`execute ${exec} error`);
			continue;
		}

		console.log(`will sleep ${config.waitingTime}s`);
		sleep(config.waitingTime);

		await recordData();
	}

	//end
	endTime = moment(Date.now()).format('YYYY-MM-DD_HH:mm:ss');

	saveToImage(1280, 720, 'image.png');
};

main();
