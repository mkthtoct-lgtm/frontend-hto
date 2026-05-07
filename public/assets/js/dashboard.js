var Card1ChartConfig = {
	chart: {
		type: 'area',
		height: 100,
		width: 150,
		offsetX: -1,
		offsetY: 1,
		toolbar: {
			show: false
		},
		zoom: {
			enabled: false
		},
		sparkline: {
			enabled: false
		}
	},
	series: [{
		name: 'Properties',
		data: [10, 12, 25, 14, 33, 16, 40, 30, 30, 20, 20]
	}],
	stroke: {
		curve: 'smooth',
		width: 2
	},
	fill: {
		type: "gradient",
		gradient: {
			shade: 'light',
			type: "vertical",
			shadeIntensity: 0.1,
			gradientToColors: ["var(--bs-primary)"],
			inverseColors: false,
			opacityFrom: 0.2,
			opacityTo: 0.01,
			stops: [20, 100]
		}
	},
	plotOptions: {
		bar: {
			columnWidth: '35%',
			borderRadius: 0,
			distributed: true
		}
	},
	colors: [
		'var(--bs-primary)'
	],
	dataLabels: {
		enabled: false
	},
	legend: {
		show: false
	},
	xaxis: {
		labels: {
			show: false
		},
		axisBorder: {
			show: false
		},
		axisTicks: {
			show: false
		}
	},
	yaxis: {
		show: false
	},
	grid: {
		show: false
	}
}
const Card1Chart = document.querySelector("#Card1Chart");
if (typeof Card1Chart !== undefined && Card1Chart !== null) {
	var chartInit = new ApexCharts(Card1Chart, Card1ChartConfig);
	chartInit.render();
}


var Card2ChartConfig = {
	chart: {
		type: 'area',
		height: 100,
		width: 150,
		offsetX: -1,
		offsetY: 1,
		toolbar: {
			show: false
		},
		zoom: {
			enabled: false
		},
		sparkline: {
			enabled: false
		}
	},
	series: [{
		name: 'Properties',
		data: [30, 60, 40, 70, 50]
	}],
	stroke: {
		curve: 'smooth',
		width: 2
	},
	fill: {
		type: "gradient",
		gradient: {
			shade: 'light',
			type: "vertical",
			shadeIntensity: 0.1,
			gradientToColors: ["var(--bs-secondary)"],
			inverseColors: false,
			opacityFrom: 0.1,
			opacityTo: 0.01,
			stops: [20, 100]
		}
	},
	plotOptions: {
		bar: {
			columnWidth: '35%',
			borderRadius: 0,
			distributed: true
		}
	},
	colors: [
		'var(--bs-secondary)'
	],
	dataLabels: {
		enabled: false
	},
	legend: {
		show: false
	},
	xaxis: {
		labels: {
			show: false
		},
		axisBorder: {
			show: false
		},
		axisTicks: {
			show: false
		}
	},
	yaxis: {
		show: false
	},
	grid: {
		show: false
	}

}
const Card2Chart = document.querySelector("#Card2Chart");
if (typeof Card2Chart !== undefined && Card2Chart !== null) {
	var chartInit = new ApexCharts(Card2Chart, Card2ChartConfig);
	chartInit.render();
}


var Card3ChartConfig = {
	chart: {
		type: 'bar',
		height: 80,
		width: 150,
		offsetX: -1,
		offsetY: 0,
		toolbar: { show: false },
		zoom: { enabled: false }
	},
	plotOptions: {
		bar: {
			columnWidth: '55%',
			borderRadius: 2,
			distributed: true
		}
	},
	colors: ['var(--bs-primary)'],
	dataLabels: { enabled: false },
	legend: { show: false },
	xaxis: {
		categories: ['', '', '', '', '', '', '', ''],
		labels: { show: false },
		axisBorder: { show: false },
		axisTicks: { show: false }
	},
	yaxis: { show: false },
	grid: { show: false },
	series: [{
		name: '',
		data: [30, 50, 90, 35, 110, 88, 150, 200]
	}]

}
const Card3Chart = document.querySelector("#Card3Chart");
if (typeof Card3Chart !== undefined && Card3Chart !== null) {
	var chartInit = new ApexCharts(Card3Chart, Card3ChartConfig);
	chartInit.render();
}


var PropertySalesChartConfig = {
	series: [
		{
			name: "Sold",
			data: [4000, 7000, 6500, 10000, 9500, 12000, 9000, 8500, 7800, 5000, 9500, 11000]
		},
		{
			name: "New Listings",
			data: [1800, 4500, 1200, 2600, 2200, 3500, 1800, 2400, 3700, 3200, 1300, 1100]
		}
	],
	chart: {
		type: "area",
		height: 320,
		toolbar: {
			show: false
		},
		dropShadow: {
			enabled: true,
			top: 3,
			left: 0,
			blur: 4,
			color: "#000",
			opacity: 0.1,
		},
		stacked: false,
		zoom: {
			enabled: false
		},
	},
	colors: ['var(--bs-primary)', 'var(--bs-secondary)'],
	dataLabels: {
		enabled: false
	},
	stroke: {
		curve: "smooth",
		width: 2
	},
	fill: {
		type: "gradient",
		gradient: {
			shadeIntensity: 1,
			opacityFrom: 0.15,
			opacityTo: 0.00,
			stops: [0, 90]
		}
	},
	grid: {
		borderColor: "var(--bs-border-color)",
		strokeDashArray: 4,
		padding: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		}
	},
	xaxis: {
		categories: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
		axisBorder: { color: 'var(--bs-border-color)' },
		axisTicks: { show: false },
		labels: {
			style: {
				colors: 'var(--bs-body-color)',
				fontSize: '13px'
			}
		}
	},
	yaxis: {
		min: 0,
		max: 12000,
		tickAmount: 4,
		labels: {
			formatter: (val) => val / 1000 + "k",
			style: {
				colors: 'var(--bs-body-color)',
				fontSize: '13px',
				fontWeight: '500',
				fontFamily: 'var(--bs-body-font-family)'
			},
			offsetX: -15
		}
	},
	tooltip: {
		shared: true,
		intersect: false,
		y: {
			formatter: (val) => "$" + val.toLocaleString()
		}
	},
	markers: {
		size: 0,
		hover: {
			size: 6
		}
	},
	legend: { show: false }
};
const PropertySalesChart = document.querySelector("#PropertySalesChart");
if (typeof PropertySalesChart !== undefined && PropertySalesChart !== null) {
	var chartInit = new ApexCharts(PropertySalesChart, PropertySalesChartConfig);
	chartInit.render();
}


var RevenueChartConfig = {
	series: [
		{
			name: 'Revenue',
			data: [390, 115, 305, 250, 102, 40, 195, 235, 280]
		},
		{
			name: 'Expenses',
			data: [105, 205, 120, 380, 105, 205, 290, 310, 105]
		},
		{
			name: 'Profit',
			data: [180, 200, 180, 250, 100, 400, 90	, 115, 195]
		}
	],
	colors: ['var(--bs-primary)', 'var(--bs-secondary)', 'var(--bs-dark)'],
	chart: {
		type: 'bar',
		height: 320,
		
		toolbar: {
            show: false
        }
	},
	plotOptions: {
		bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 3,
        },
	},
	dataLabels: {
		enabled: false
	},
	stroke: {
		show: true,
		width: 2,
		colors: ['transparent']
	},
	xaxis: {
		categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
		axisBorder: {
			color: 'var(--bs-border-color)',
		},
		axisTicks: {
			show: false,
		},
		labels: {
			style: {
				colors: 'var(--bs-body-color)',
				fontSize: '13px',
				fontFamily: 'var(--bs-body-font-family)'
			}
		}
	},
	yaxis: {
		min: 0,
		max: 500,
		tickAmount: 5,
		labels: {
			formatter: function (val) {
				return "$" + val / 10 + "k";
			},
			style: {
				colors: 'var(--bs-body-color)',
				fontSize: '13px',
				fontFamily: 'var(--bs-body-font-family)'
			}
		}
	},
	grid: {
		borderColor: 'var(--bs-border-color)',
		strokeDashArray: 5,
		xaxis: {
			lines: {
				show: false
			}
		},
		yaxis: {
			lines: {
				show: true,
			}
		}
	},
	fill: {
		opacity: 1
	},
	tooltip: {
		y: {
            formatter: function (val) {
				return "$" + val + "k"
            }
		}
	},
	legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        markers: {
			size: 5,
            shape: 'circle',
            radius: 10,
			width: 10,
			height: 10,
		},
		labels: {
			colors: 'var(--bs-heading-color)',
			fontFamily: 'var(--bs-body-font-family)',
			fontSize: '13px',
        }
    }
};
const RevenueChart = document.querySelector("#RevenueChart");
if (typeof RevenueChart !== undefined && RevenueChart !== null) {
	var chartInit = new ApexCharts(RevenueChart, RevenueChartConfig);
	chartInit.render();
}


var RevenueChart2Config = {
	series: [
		{
			name: "Gross Salary",
			data: [55000, 60000, 68000, 52000, 69000, 73000, 71000, 74000, 70000, 75000, 72000, 77000]
		},
		{
			name: "Net Salary",
			data: [25000, 27000, 16000, 15500, 16500, 17200, 15800, 17000, 16200, 16800, 16000, 17500]
		},
		{
			name: "Tax Dedication",
			type: 'line',
			data: [25000, 50000, 40000, 20000, 52500, 45000, 55200, 47000, 25800, 58200, 36000, 59500]
		}
	],
	chart: {
		type: 'bar',
		height: 320,
		stacked: true,
		toolbar: {
			show: false
		},
		zoom: {
           enabled: true
		},
		dropShadow: {
           enabled: true,
           enabledOnSeries: undefined,
           top: 3,
           left: 0,
           blur: 4,
           color: "#000",
           opacity: 0.1,
		},
	},
	grid: {
		borderColor: 'var(--bs-border-color)',
		strokeDashArray: 3
	},
	yaxis: {
        min: 100000,
        max: 0,
        tickAmount: 5,
		labels: {
			formatter: function (value) {
				return (value / 1000) + "K";
			},
			style: {
				colors: 'var(--bs-body-color)',
				fontSize: '13px',
				fontFamily: 'var(--bs-body-font-family)'
			}
		}
    },
	xaxis: {
		type: "month",
		categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		axisBorder: {
			color: 'var(--bs-border-color)',
			axisBorder: {
				show: true,
				color: 'var(--bs-light)',
				height: 0.5,
				width: '100%',
				offsetX: 0,
				offsetY: 0
			},
		},
		axisTicks: {
			show: false,
		},
		labels: {
			rotate: -90,
			style: {
				colors: 'var(--bs-body-color)',
				fontSize: '13px',
				fontFamily: 'var(--bs-body-font-family)'
			}
		},
	},
	colors: [
		"var(--bs-secondary)",
		"var(--bs-primary)",
		"var(--bs-info)"
	],
	legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        markers: {
			size: 5,
            shape: 'circle',
            radius: 10,
			width: 8,
			height: 8,
		},
		labels: {
			colors: 'var(--bs-heading-color)',
			fontFamily: 'var(--bs-body-font-family)',
			fontSize: '13px',
        }
    },
	markers: {
		size: 4,
		colors: ['var(--bs-info)'], 
		strokeColors: '#ffffff',
		strokeWidth: 2,
		hover: {
			size: 4
		}
	},
	stroke: {
		curve: 'straight',
		width: [0, 0, 2.5],
	},
	plotOptions: {
		bar: {
			columnWidth: "40%",
			borderRadius: 0,
		}
	},
	dataLabels: {
		enabled: false
	},
	fill: {
		opacity: 1
	}
};
const RevenueChart2 = document.querySelector("#RevenueChart2");
if (typeof RevenueChart2 !== undefined && RevenueChart2 !== null) {
	var chartInit = new ApexCharts(RevenueChart2, RevenueChart2Config);
	chartInit.render();
}


var Score1Config = {
	series: [75],
	chart: {
		type: 'radialBar',
		height: 50,
		width: 50,
		sparkline: {
			enabled: true
		}
	},
	plotOptions: {
		radialBar: {
			hollow: {
				margin: 0,
				size: '90%'
			},
			track: {
				background: 'rgba(var(--bs-primary-rgb), 0.1)',
				strokeWidth: '100%',
				margin: -2
			},
			dataLabels: {
				show: true,
				name: {
					show: false
				},
				value: {
					fontSize: '12px',
					fontWeight: '500',
					fontFamily: 'var(--bs-body-font-family)',
					color: 'var(--bs-heading-color)',
					show: true,
					offsetY: 5
				}
			},
		}
	},
	stroke: {
		lineCap: 'round'
	},
	colors: ['var(--bs-primary)'],
}
const Score1 = document.querySelector("#Score1");
if (typeof Score1 !== undefined && Score1 !== null) {
	var chartInit = new ApexCharts(Score1, Score1Config);
	chartInit.render();
}


var Score2Config = {
	series: [90],
	chart: {
		type: 'radialBar',
		height: 50,
		width: 50,
		sparkline: {
			enabled: true
		}
	},
	plotOptions: {
		radialBar: {
			hollow: {
				margin: 0,
				size: '90%'
			},
			track: {
				background: 'rgba(var(--bs-secondary-rgb), 0.1)',
				strokeWidth: '100%',
				margin: -2
			},
			dataLabels: {
				show: true,
				name: {
					show: false
				},
				value: {
					fontSize: '12px',
					fontWeight: '500',
					fontFamily: 'var(--bs-body-font-family)',
					color: 'var(--bs-heading-color)',
					show: true,
					offsetY: 5
				}
			},
		}
	},
	stroke: {
		lineCap: 'round'
	},
	colors: ['var(--bs-secondary)'],
}
const Score2 = document.querySelector("#Score2");
if (typeof Score2 !== undefined && Score2 !== null) {
	var chartInit = new ApexCharts(Score2, Score2Config);
	chartInit.render();
}


var Score3Config = {
	series: [85],
	chart: {
		type: 'radialBar',
		height: 50,
		width: 50,
		sparkline: {
			enabled: true
		}
	},
	plotOptions: {
		radialBar: {
			hollow: {
				margin: 0,
				size: '90%'
			},
			track: {
				background: 'rgba(var(--bs-warning-rgb), 0.1)',
				strokeWidth: '100%',
				margin: -2
			},
			dataLabels: {
				show: true,
				name: {
					show: false
				},
				value: {
					fontSize: '12px',
					fontWeight: '500',
					fontFamily: 'var(--bs-body-font-family)',
					color: 'var(--bs-heading-color)',
					show: true,
					offsetY: 5
				}
			},
		}
	},
	stroke: {
		lineCap: 'round'
	},
	colors: ['var(--bs-warning)'],
}
const Score3 = document.querySelector("#Score3");
if (typeof Score3 !== undefined && Score3 !== null) {
	var chartInit = new ApexCharts(Score3, Score3Config);
	chartInit.render();
}


var Score4Config = {
	series: [95],
	chart: {
		type: 'radialBar',
		height: 50,
		width: 50,
		sparkline: {
			enabled: true
		}
	},
	plotOptions: {
		radialBar: {
			hollow: {
				margin: 0,
				size: '90%'
			},
			track: {
				background: 'rgba(var(--bs-secondary-rgb), 0.1)',
				strokeWidth: '100%',
				margin: -2
			},
			dataLabels: {
				show: true,
				name: {
					show: false
				},
				value: {
					fontSize: '12px',
					fontWeight: '500',
					fontFamily: 'var(--bs-body-font-family)',
					color: 'var(--bs-heading-color)',
					show: true,
					offsetY: 5
				}
			},
		}
	},
	stroke: {
		lineCap: 'round'
	},
	colors: ['var(--bs-secondary)'],
}
const Score4 = document.querySelector("#Score4");
if (typeof Score4 !== undefined && Score4 !== null) {
	var chartInit = new ApexCharts(Score4, Score4Config);
	chartInit.render();
}


var Score5Config = {
	series: [70],
	chart: {
		type: 'radialBar',
		height: 50,
		width: 50,
		sparkline: {
			enabled: true
		}
	},
	plotOptions: {
		radialBar: {
			hollow: {
				margin: 0,
				size: '90%'
			},
			track: {
				background: 'rgba(var(--bs-danger-rgb), 0.1)',
				strokeWidth: '100%',
				margin: -2
			},
			dataLabels: {
				show: true,
				name: {
					show: false
				},
				value: {
					fontSize: '12px',
					fontWeight: '500',
					fontFamily: 'var(--bs-body-font-family)',
					color: 'var(--bs-heading-color)',
					show: true,
					offsetY: 5
				}
			},
		}
	},
	stroke: {
		lineCap: 'round'
	},
	colors: ['var(--bs-danger)'],
}
const Score5 = document.querySelector("#Score5");
if (typeof Score5 !== undefined && Score5 !== null) {
	var chartInit = new ApexCharts(Score5, Score5Config);
	chartInit.render();
}


var agentStatusChartConfig = {
	series: [
		{
			name: "Order",
            data: [300000, 80000, 300000, 300000, 290000, 210000, 350000, 500000, 380000]
		},
		{
			name: 'Income Growth',
            data: [0, 200000, 350000, 180000, 190000, 400000, 400000, 280000, 220000]
		}
	],
	chart: {
		height: 325,
		type: 'line',
		zoom: {
            enabled: false
		},
		toolbar:{
			show: false
		},
	},
	colors:[
		"var(--bs-secondary)",
		"var(--bs-primary)"
	],
	dataLabels: {
		enabled: false
	},
	stroke: {
		width: [2, 2],
		curve: 'smooth',
		dashArray: [8, 0]
	},
	markers: {
		size: 0,
		hover: {
			sizeOffset: 6
		}
	},
	yaxis: {
        min: 500000,
        max: 0,
        tickAmount: 5,
		labels: {
			formatter: function (value) {
				return (value / 1000) + "K";
			},
			style: {
				colors: 'var(--bs-body-color)',
				fontSize: '13px',
				fontFamily: 'var(--bs-body-font-family)'
			}
		}
    },
	xaxis: {
		categories: ['Jan', 'Feb', 'Mar', 'May', 'Jun', 'July', 'Aug', 'Sep'],
		axisBorder: {
			color: 'var(--bs-border-color)',
		},
		axisTicks: {
			show: false,
		},
		labels: {
			style: {
				colors: "var(--bs-body-color)",
				fontSize: "13px",
				fontWeight: "500"
			}
		}
	},
	tooltip: {
		y: [{
			title: {
				formatter: function (val) {
					return val + " per session"
				}
			}
		},
		{
			title: {
				formatter: function (val) {
					return val;
				}
			}
		}]
	},
	grid: {
		strokeDashArray: 4,
		borderColor: "var(--bs-border-color)",
		padding: { left: 10, right: 10 }
	},
	legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        markers: {
			size: 5,
            shape: 'circle',
            radius: 10,
			width: 10,
			height: 10,
		},
		labels: {
			colors: 'var(--bs-heading-color)',
			fontFamily: 'var(--bs-body-font-family)',
			fontSize: '13px',
        }
	}
}
const agentStatusChart = document.querySelector("#agentStatusChart");
if (typeof agentStatusChart !== undefined && agentStatusChart !== null) {
	var chartInit = new ApexCharts(agentStatusChart, agentStatusChartConfig);
	chartInit.render();
}


var AnalyticsScore1Config = {
	series: [75],
	chart: {
		type: 'radialBar',
		height: 65,
		width: 65,
		sparkline: {
			enabled: true
		}
	},
	plotOptions: {
		radialBar: {
			hollow: {
				margin: 0,
				size: '80%'
			},
			track: {
				background: 'rgba(var(--bs-primary-rgb), 0.1)',
				strokeWidth: '100%',
				margin: -2
			},
			dataLabels: {
				show: true,
				name: {
					show: false
				},
				value: {
					fontSize: '12px',
					fontWeight: '500',
					fontFamily: 'var(--bs-body-font-family)',
					color: 'var(--bs-heading-color)',
					show: true,
					offsetY: 5
				}
			},
		}
	},
	stroke: {
		lineCap: 'round'
	},
	colors: ['var(--bs-primary)'],
}
const AnalyticsScore1 = document.querySelector("#AnalyticsScore1");
if (typeof AnalyticsScore1 !== undefined && AnalyticsScore1 !== null) {
	var chartInit = new ApexCharts(AnalyticsScore1, AnalyticsScore1Config);
	chartInit.render();
}


var AnalyticsScore2Config = {
	series: [40],
	chart: {
		type: 'radialBar',
		height: 65,
		width: 65,
		sparkline: {
			enabled: true
		}
	},
	plotOptions: {
		radialBar: {
			hollow: {
				margin: 0,
				size: '80%'
			},
			track: {
				background: 'rgba(var(--bs-secondary-rgb), 0.1)',
				strokeWidth: '100%',
				margin: -2
			},
			dataLabels: {
				show: true,
				name: {
					show: false
				},
				value: {
					fontSize: '12px',
					fontWeight: '500',
					fontFamily: 'var(--bs-body-font-family)',
					color: 'var(--bs-heading-color)',
					show: true,
					offsetY: 5
				}
			},
		}
	},
	stroke: {
		lineCap: 'round'
	},
	colors: ['var(--bs-secondary)'],
}
const AnalyticsScore2 = document.querySelector("#AnalyticsScore2");
if (typeof AnalyticsScore2 !== undefined && AnalyticsScore2 !== null) {
	var chartInit = new ApexCharts(AnalyticsScore2, AnalyticsScore2Config);
	chartInit.render();
}


var AnalyticsScore3Config = {
	series: [85],
	chart: {
		type: 'radialBar',
		height: 65,
		width: 65,
		sparkline: {
			enabled: true
		}
	},
	plotOptions: {
		radialBar: {
			hollow: {
				margin: 0,
				size: '80%'
			},
			track: {
				background: 'rgba(var(--bs-success-rgb), 0.1)',
				strokeWidth: '100%',
				margin: -2
			},
			dataLabels: {
				show: true,
				name: {
					show: false
				},
				value: {
					fontSize: '12px',
					fontWeight: '500',
					fontFamily: 'var(--bs-body-font-family)',
					color: 'var(--bs-heading-color)',
					show: true,
					offsetY: 5
				}
			},
		}
	},
	stroke: {
		lineCap: 'round'
	},
	colors: ['var(--bs-success)'],
}
const AnalyticsScore3 = document.querySelector("#AnalyticsScore3");
if (typeof AnalyticsScore3 !== undefined && AnalyticsScore3 !== null) {
	var chartInit = new ApexCharts(AnalyticsScore3, AnalyticsScore3Config);
	chartInit.render();
}


var AnalyticsScore4Config = {
	series: [27],
	chart: {
		type: 'radialBar',
		height: 65,
		width: 65,
		sparkline: {
			enabled: true
		}
	},
	plotOptions: {
		radialBar: {
			hollow: {
				margin: 0,
				size: '80%'
			},
			track: {
				background: 'rgba(var(--bs-info-rgb), 0.1)',
				strokeWidth: '100%',
				margin: -2
			},
			dataLabels: {
				show: true,
				name: {
					show: false
				},
				value: {
					fontSize: '12px',
					fontWeight: '500',
					fontFamily: 'var(--bs-body-font-family)',
					color: 'var(--bs-heading-color)',
					show: true,
					offsetY: 5
				}
			},
		}
	},
	stroke: {
		lineCap: 'round'
	},
	colors: ['var(--bs-info)'],
}
const AnalyticsScore4 = document.querySelector("#AnalyticsScore4");
if (typeof AnalyticsScore4 !== undefined && AnalyticsScore4 !== null) {
	var chartInit = new ApexCharts(AnalyticsScore4, AnalyticsScore4Config);
	chartInit.render();
}


var SalesStatisticConfig = {
		series: [
		{
			name: "Net Profit",
			data: [10000, 22000, 30000, 55000, 50000, 75000, 60000, 100000]
		}
	],
	chart: {
		height: 320,
		type: 'area',
		toolbar:{
			show: false
		},
	},
	colors:[
		"var(--bs-primary)",
	],
	dataLabels: {
		enabled: false
	},
	stroke: {
		curve: 'smooth',
		width: 3,
	},
	fill: {
		type: "gradient",
		gradient: {
			shade: 'light',
			type: "vertical",
			shadeIntensity: 0.1,
			gradientToColors: ["var(--bs-info)"],
			inverseColors: false,
			opacityFrom: 0.1,
			opacityTo: 0.06,
			stops: [20, 100]
		}
	},
	xaxis: {
		categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
		axisBorder: { color: "var(--bs-border-color)" },
		axisTicks: { show: false },
		labels: {
			style: {
				colors: "var(--bs-body-color)",
				fontSize: "13px"
			}
		}
	},
	yaxis: {
		min: 0,
		max: 100000,
		tickAmount: 5,
		labels: {
			style: {
				colors: 'var(--bs-body-color)',
				fontSize: '14px',
			},
			 formatter: function (val) {
				if (val >= 1000) {
					return "$" + (val / 1000).toFixed(1) + "k";
				}
				return "$" + val;
			}
		},
	},
	tooltip: {
		y: {
			formatter: function (val) {
				return "$" + val.toLocaleString();
			}
		}
	},
	grid: {
		strokeDashArray: 4,
		borderColor: "var(--bs-border-color)",
		padding: { left: 10, right: 10 }
	},
	legend: {
		show: false
	}
};
const SalesStatistic = document.querySelector("#SalesStatistic");
if (typeof SalesStatistic !== undefined && SalesStatistic !== null) {
	var chartInit = new ApexCharts(SalesStatistic, SalesStatisticConfig);
	chartInit.render();
}


var AnalyticsRevenuecConfig = {
	series: [
		{
			name: "Income",
			data: [520, 155, 241, 367, 222, 443, 321, 499, 489, 412, 356, 278]
		},
		{
			name: "Expenses",
			data: [213, 323, 220, 308, 413, 527, 333, 412, 512, 425, 378, 290]
		},
		{
			name: "Profit",
			data: [311, 417, 515, 415, 521, 614, 715, 613, 713, 813, 913, 712]
		}
	],
	chart: {
		type: 'bar',
		height: 320,
		stacked: true,
		stackType: '100%',
		toolbar: { show: false }
	},
	colors: [
		'var(--bs-primary)',
		'var(--bs-secondary)',
		'var(--bs-info)'
	],
	stroke: {
		show: true,
		width: 1,
		colors: ['var(--bs-body-bg)']
	},
	markers: {
		size: 4,
		colors: ["#fff"],
		strokeColors: ["var(--bs-primary)", "var(--bs-secondary)", "var(--bs-warning)"],
		strokeWidth: 3,
		hover: { size: 7 }
	},
	xaxis: {
		categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		axisBorder: { color: "var(--bs-border-color)" },
		axisTicks: { show: false },
		labels: {
			style: {
				colors: "var(--bs-body-color)",
				fontSize: "13px"
			}
		}
	},
	yaxis: {
		min: 0,
		max: 500,
		tickAmount: 5,
		labels: {
			formatter: function (val) {
				return "$" + val / 10 + "k";
			},
			style: {
				colors: "var(--bs-body-color)",
				fontSize: "13px",
				fontWeight: "500"
			}
		}
	},
	grid: {
		borderColor: "var(--bs-border-color)",
		strokeDashArray: 5,
		yaxis: {
			lines: {
				show: true,
			},
		},
	},
	plotOptions: {
		bar: {
			horizontal: false,
			endingShape:'rounded',
			columnWidth: '25%',
			borderRadius: 6,
		}
	},
	dataLabels: {
		enabled: false
	},
	markers: {
		size: 0
	},
	tooltip: {
		shared: true,
		intersect: false,
		y: {
			formatter: function (val) {
				return "$" + val.toLocaleString();
			}
		}
	},
	legend: {
		show: true,
		position: "bottom",
		horizontalAlign: "center",
		fontSize: "13px",
		fontWeight: 500,
		labels: { colors: "var(--bs-body-color)" },
		markers: { width: 10, height: 10, radius: 12 }
	}
};
const AnalyticsRevenue = document.querySelector("#AnalyticsRevenue");
if (typeof AnalyticsRevenue !== undefined && AnalyticsRevenue !== null) {
	var chartInit = new ApexCharts(AnalyticsRevenue, AnalyticsRevenuecConfig);
	chartInit.render();
}


if ($('#dt_PropertyListing').length) {
	const dt_PropertyListing = $('#dt_PropertyListing').DataTable({		
		pageLength: 6,
		searching: true,
		language: {
			searchPlaceholder: 'Search',
			paginate: {
				previous: "<i class='fi fi-rr-angle-left'></i>",
				next: "<i class='fi fi-rr-angle-right'></i>",
				first: "<i class='fi fi-rr-angle-double-left'></i>",
				last: "<i class='fi fi-rr-angle-double-right'></i>"
			},
		},
		initComplete: function() {
			var dtSearch = $('#dt_PropertyListing_wrapper .dt-search').detach();
			$('#dt_PropertyListing_Search').append(dtSearch);
			$('#dt_PropertyListing_Search .dt-search').prepend('<i class="fi fi-rr-search"></i>');
			$('#dt_PropertyListing_Search .dt-search label').remove();
			$('#dt_PropertyListing_wrapper > .row.mt-2.justify-content-between').first().remove();
		},
	});	
}


if ($('#dt_Files').length) {
	const dt_Files = $('#dt_Files').DataTable({		
		pageLength: 6,
		searching: true,
		language: {
			searchPlaceholder: 'Search',
			paginate: {
				previous: "<i class='fi fi-rr-angle-left'></i>",
				next: "<i class='fi fi-rr-angle-right'></i>",
				first: "<i class='fi fi-rr-angle-double-left'></i>",
				last: "<i class='fi fi-rr-angle-double-right'></i>"
			},
		},
		initComplete: function() {
			var dtSearch = $('#dt_Files_wrapper .dt-search').detach();
			$('#dt_Files_Search').append(dtSearch);
			$('#dt_Files_Search .dt-search').prepend('<i class="fi fi-rr-search"></i>');
			$('#dt_Files_Search .dt-search label').remove();
			$('#dt_Files_wrapper > .row.mt-2.justify-content-between').first().remove();
		},
	});	
}


function ApplicantTypeChartConfig() {
	const centerTextPlugin = {
		afterDraw(chart) {
			const { ctx, chartArea: { left, right, top, bottom } } = chart;
			const centerX = (left + right) / 2;
			const centerY = (top + bottom) / 2;
			const dataset = chart.data.datasets[0];
			const total = dataset.data.reduce((acc, val) => acc + val, 0);

			ctx.save();
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			// Total value
			ctx.font = 'bold 22px sans-serif';
			ctx.fillStyle = '#000';
			ctx.fillText(`$${total.toLocaleString()}`, centerX, centerY - 10);

			// Label below
			ctx.font = '14px sans-serif';
			ctx.fillStyle = '#666';
			ctx.fillText('This Month', centerX, centerY + 18);

			ctx.restore();
		}
	};

	const canvas = document.getElementById('ApplicantTypeChart');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	
	new Chart(ctx, {
		type: 'doughnut',
		data: {
			labels: ['Rent', 'Sales', 'Broker Deal', 'Market'],
			datasets: [{
				data: [26350, 12654, 8000, 7628],
				backgroundColor: ['#0188AD', '#319DBA', '#61B2C8', '#8FC5D4'],
				borderRadius: 10,
				spacing: 5,
				hoverOffset: 10,
				borderWidth: 0,
			}]
		},
		options: {
			cutout: '85%',
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: context => `${context.label}: $${context.raw.toLocaleString()}`
					}
				}
			}
		},
		plugins: [centerTextPlugin]
	});
}
ApplicantTypeChartConfig();