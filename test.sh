#!/bin/bash
processName=com.ccdt.homelink
timeStampFile=$(date "+%Y%m%d%H%M%S")
adb shell dumpsys meminfo $processName | tee -a $processName$timeStampFile'_memoryDetail.txt' | grep -E "TOTAL|Dalvik Heap|Native Heap" | grep -v "TOTAL:" | sed 's/Heap//g' | awk 'NR!=4{print $2}'
