import StreamLayer from "@geoscene/core/layers/StreamLayer";

export default class MoveCar {
	constructor(map, points, v, modelUrl) {
		this.map = map;
		this.points = points;
		this.v = v;
		this.moving = null;
		this.modelUrl = modelUrl;
		this.layer = null;
		this.start = 0;
		this.end = 1;
		this.carPoint = {
			x: points[0][0],
			y: points[0][1],
		};
	}

	addStreamLayer() {
		const symbol = {
			type: "point-3d", // 转换成 new PointSymbol3D()
			symbolLayers: [
				{
					type: "object",
					resource: {
						href: this.modelUrl,
					},
					height: 3,
					material: {
						// color: "red",
					},
				},
			],
		};
		this.layer = new StreamLayer({
			id: "StreamLayerCar",
			fields: [
				{
					name: "OBJECTID",
					alias: "OBJECTID",
					type: "oid",
				},
				{
					name: "TRACKID",
					alias: "TrackId",
					type: "long",
				},
				{
					name: "STATUS",
					alias: "STATUS",
					type: "string",
				},
			],
			timeInfo: {
				trackIdField: "TRACKID",
			},
			updateInterval: 100,
			geometryType: "point", // required property

			renderer: {
				type: "simple",
				symbol: symbol,
				visualVariables: [
					{
						type: "size", // 修改大小的视觉变量
						axis: "height", // height 高，width 宽, depth 深
						field: "height", // 用于修改该视觉变量的字段值
						valueUnit: "meters", // 单位米
					},
					{
						type: "rotation", // 修改旋转的视觉变量
						axis: "heading", // heading-符号在水平面上的旋转，tilt-符号在纵向垂直平面上的旋转，roll-符号在横向垂直平面上的旋转
						field: "heading", // 用于修改该视觉变量的字段值
						rotationType: "arithmetic", // geographic：从正北方向顺时针方向旋转  arithmetic：从正东方向逆时针旋转
					},
				],
			},
		});
		this.map.add(this.layer);
	}
	setPoints(points) {
		this.points = points;
		this.carPoint = {
			x: points[0][0],
			y: points[0][1],
		};
	}
	setSpeed(v) {
		this.v = v;
	}
	startExecute() {
		if (!this.layer) {
			this.addStreamLayer();
		}

		let callback = this.updateCar(this.layer);
		this.moveCar(this.points, this.v, callback);
	}
	terminateExecute() {
		clearInterval(this.moving);
	}
	clearCar() {
		clearInterval(this.moving);
		this.map.remove(this.layer);
		this.layer = null;
		this.start = 0;
		this.end = 1;
		this.carPoint = {
			x: this.points[0][0],
			y: this.points[0][1],
		};
	}

	moveCar(points, v, callback) {
		let x1 = points[this.start][0];
		let y1 = points[this.start][1];
		let x2 = points[this.end][0];
		let y2 = points[this.end][1];

		let p = (y2 - y1) / (x2 - x1); // 斜率
		// var v = 1; // 速度
		let dx = x2 - x1;
		let dy = y2 - y1;
		let xSign = this.getSign(dx);
		let ySign = this.getSign(dy);
		// 计算汽车角度
		let angle = this.getAngle({ x: x1, y: y1 }, { x: x2, y: y2 });
		let that = this;
		this.moving = setInterval(function () {
			// 分别计算 x,y轴方向速度
			if (Math.abs(p) === Number.POSITIVE_INFINITY) {
				// 无穷大
				that.carPoint.y += ySign * v;
			} else {
				that.carPoint.x += xSign * (1 / Math.sqrt(1 + p * p)) * v;
				that.carPoint.y += ySign * (Math.abs(p) / Math.sqrt(1 + p * p)) * v;
			}
			// 图层刷新
			callback({
				carPoint: that.carPoint,
				height: 10, // 设置的模型高度视觉变量的属性值
				heading: angle, // 设置模型水平旋转视觉变量的属性值
			});
			if (
				Math.abs(that.carPoint.x - x2) < v &&
				Math.abs(that.carPoint.y - y2) < v
			) {
				callback({
					carPoint: {
						x: x2,
						y: y2,
					},
					height: 10, // 设置的模型高度视觉变量的属性值
					heading: angle, // 设置模型水平旋转视觉变量的属性值
				});

				clearInterval(that.moving);
				that.start++;
				that.end++;

				if (that.end < points.length) {
					that.moveCar(points, v, callback);
				}
			}
		}, 50);
	}

	// 获取斜率值
	getSign(number) {
		if (number > 0) {
			return 1; // 正数
		} else if (number < 0) {
			return -1; // 负数
		}
		return 0; // 数值为0
	}
	// 获取线段角度
	getAngle(p1, p2) {
		// 计算线段的斜率
		let slope = (p2.y - p1.y) / (p2.x - p1.x);
		// 计算反正切值，得到弧度制的角度
		let angleRad = Math.atan(slope);
		// 将弧度制转换为角度制
		let angleDeg = (angleRad * 180) / Math.PI;
		// 如果线段在第二、三象限，则加上180度
		if (p2.x < p1.x) {
			angleDeg += 180;
		}
		// 如果角度超出-180度到180度的范围，则减去360度或加上360度
		if (angleDeg > 180) {
			angleDeg -= 360;
		} else if (angleDeg < -180) {
			angleDeg += 360;
		}
		return angleDeg;
	}
	updateCar(layer) {
		let objectIdCounter = 0;
		return function (att) {
			layer.sendMessageToClient({
				type: "features",
				features: [
					{
						attributes: {
							TRACKID: 1,
							OBJECTID: objectIdCounter++,
							height: 10, // 设置的模型高度视觉变量的属性值
							heading: att.heading, // 设置模型水平旋转视觉变量的属性值
						},
						geometry: {
							x: att.carPoint.x, // 更新到点2的位置
							y: att.carPoint.y,
						},
					},
				],
			});
		};
	}
}
