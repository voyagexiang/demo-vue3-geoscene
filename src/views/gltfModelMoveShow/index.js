export default class MoveCar {
  constructor(points, v, updateGltf) {
    this.points = points
    this.v = v
    this.moving = null
    this.updateGltf = updateGltf
    this.start = 0
    this.end = 1
    this.carPoint = {
      x: points[0][0],
      y: points[0][1]
    }
  }


  setPoints(points) {
    this.points = points
    this.carPoint = {
      x: points[0][0],
      y: points[0][1]
    }
  }

  setSpeed(v) {
    this.v = v
  }

  startExecute() {
    this.moveCar(this.points, this.v, this.updateGltf)
  }

  terminateExecute() {
    clearInterval(this.moving)
  }

  clearCar() {
    clearInterval(this.moving)
    this.start = 0
    this.end = 1
    this.carPoint = {
      x: this.points[0][0],
      y: this.points[0][1]
    }
  }

  moveCar(points, v, callback) {
    let x1 = points[this.start][0]
    let y1 = points[this.start][1]
    let x2 = points[this.end][0]
    let y2 = points[this.end][1]

    let p = (y2 - y1) / (x2 - x1) // 斜率
    // var v = 1; // 速度
    let dx = x2 - x1
    let dy = y2 - y1
    let xSign = this.getSign(dx)
    let ySign = this.getSign(dy)
    // 计算汽车角度
    let angle = this.getAngle({ x: x1, y: y1 }, { x: x2, y: y2 })
    let angleCount = 0
    // 不同坐标轴移动的速度
    let vx = xSign * (1 / Math.sqrt(1 + p * p)) * v
    let vy = ySign * (Math.abs(p) / Math.sqrt(1 + p * p)) * v
    let that = this
    this.moving = setInterval(function() {
      if (
        Math.abs(that.carPoint.x - x2) < v &&
        Math.abs(that.carPoint.y - y2) < v
      ) {
        // 移动到线段终点
        callback({
          carPoint: {
            x: x2,
            y: y2
          },
          height: 1000, // 设置的模型高度视觉变量的属性值
          heading: angle, // 设置模型水平旋转视觉变量的属性值
          angleCount: angleCount
        })

        clearInterval(that.moving)
        that.start++
        that.end++

        if (that.end < points.length) {
          that.moveCar(points, v, callback)
        }
        return
      }

      // 分别计算 x,y轴方向速度
      if (Math.abs(p) === Number.POSITIVE_INFINITY) {
        // 无穷大
        that.carPoint.y += ySign * v
      } else {
        that.carPoint.x += vx
        that.carPoint.y += vy
      }

      // 图层刷新
      callback({
        carPoint: that.carPoint,
        height: 1000, // 设置的模型高度视觉变量的属性值
        heading: angle, // 设置模型水平旋转视觉变量的属性值
        angleCount: angleCount

      })
      angleCount++
    }, 50)
  }

  // 获取斜率值
  getSign(number) {
    if (number > 0) {
      return 1 // 正数
    } else if (number < 0) {
      return -1 // 负数
    }
    return 0 // 数值为0
  }

  // 获取线段角度
  getAngle(p1, p2) {
    let dx = p2.x - p1.x
    let dy = p2.y - p1.y

    // 计算线段的斜率
    let slope = Math.abs(dx / dy)
    // 计算反正切值，得到弧度制的角度
    let angleRad = Math.atan(slope)
    // 将弧度制转换为角度制
    let angleDeg = (angleRad * 180) / Math.PI
    // 逆时针旋转
    // 一象限
    if (dx * dy >= 0 && (dy > 0 || dx > 0)) {
      angleDeg = -angleDeg
    }
    // 三象限
    else if (dx * dy >= 0 && (dy < 0 || dx < 0)) {
      angleDeg = 180 - angleDeg
    }
    // 四象限
    else if (dx * dy <= 0 && (dy < 0)) {
      angleDeg = 180 + angleDeg
    }
    angleDeg = angleDeg / 180 * Math.PI
    return angleDeg
  }
}