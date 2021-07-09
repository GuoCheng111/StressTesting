module.exports = {
	packageName: 'com.ccdt.homelink',
	initWaitingTime: 10, //进入app后等待的初始化时间
	waitingTime: 3, //每次按键后的等待时间
	runTime: 2 * 60 * 60, //运行时长 秒
	tranquility: 10 * 60, //测试结束后  平静期 秒

	cmds: [
		{
			type: 'touch',
			x: 639,
			y: 214
		},
		{
			type: 'back'
		},
		{
			type: 'touch',
			x: 239,
			y: 386
		},
		{
			type: 'back'
		},
		{
			type: 'touch',
			x: 670,
			y: 393
		},
		{
			type: 'back'
		}
	]
};
