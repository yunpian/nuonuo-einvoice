/**
 * 诺诺网电子发票客户端
 * Created by gzj on 17/5/26.
 */
const axios = require('axios')
const crypto = require('crypto')
const qs = require('qs')

const PRODUCT_ENV = 'http://nnfp.jss.com.cn'
const TEST_ENV = 'http://115.236.64.124:18080'
const ENCRYPT_KEY = 'LmMGStGtOpF4xNyvYt54EQ=='

class Client {
  /**
   * @param identity {string} 企业标识
   * @param isTest {boolean} 是否为测试环境
   */
  constructor (identity, isTest = true) {
    this.identity = identity
    this.host = isTest ? TEST_ENV : PRODUCT_ENV
  }

  get _encryptKeyByte () { return new Buffer(ENCRYPT_KEY, 'base64') }

  get _cipherKey () { return this._encryptKeyByte.slice(0, 8) }

  get _cipherIV () { return this._encryptKeyByte.slice(8, 16) }

  _getCipher () { return crypto.createCipheriv('des-cbc', this._cipherKey, this._cipherIV) }

  _encryptDES (src) {
    const cipher = this._getCipher()

    cipher.setAutoPadding(true)
    const out = [cipher.update(src), cipher.final()]
    return Buffer.concat(out).toString('base64')
  }

  _encrypt (content) {
    content = new Buffer(content, 'utf8')
    const contentHash = new Buffer(crypto.createHash('md5').update(content).digest())
    return this._encryptDES(Buffer.concat([contentHash, content]))
  }

  /**
   * 开票
   * @param param {object} 格式如下：
   *    {
   *      buyername: <string: 必填，购方名称， e: 浙江爱信诺>,
   *      taxnum: <string: 选填，购方税号，企业要填,个人可为空，eg: 339901999999103>,
   *      phone: <string: 必填，购方手机(开票成功会短信提醒购方)，eg: 15858585858>,
   *      address: <string: 选填，购方地址，企业要填,个人可为空，eg: 浙江省杭州市万塘路>,
   *      account: <string: 选填，银行账号，企业要填,个人可为空>,
   *      orderno: <string: 必填，订单号>,
   *      invoicedate: <string: 必填，开票日期，eg: 2016-01-13 12:30:00>,
   *      clerk: <string: 必填，开票员>,
   *      saleaccount: <string: 选填，销售方银行账号>,
   *      salephone: <string: 必填，销售方电话>,
   *      saleaddress: <string: 必填，销售方地址>,
   *      saletaxnum: <string: 必填，销售方税号>,
   *      taxtotal: <string: 必填，合计税额，精确到小数点后面两位，红票为负，eg: 6.00>,
   *      ordertotal: <string: 必填，订单总价，精确到小数点后面两位，红票为负，eg: 200.00>,
   *      bhtaxtotal: <string: 必填，不含税金额，精确到小数点后面两位，红票为负，eg: 194.00>,
   *      kptype: <string: 必填，开票类型: 1=正票; 2=红票>,
   *      message: <string: 选填，备注，冲红时,必须在备注中注明“对应正数发票代码:XXXXXXXXX 号码:YYYYYYYY”文案,其中“X”为发票代码, “Y”为发票号码,否则接口会自动添加该文案>,
   *      payee: <string: 选填，收款人>,
   *      checker: <string: 选填，复核人>,
   *      fpdm: <string: 选填，对应蓝票发票代码，红票必填,不满12位请左补0>,
   *      fphm: <string: 选填，对应蓝票发票号码，红票必填,不满8位请左补0>,
   *      tsfs: <string: 选填，推送方式: -1=不推送; 0=邮箱; 1=手机(默认); 2=邮箱、手机>,
   *      email: <string: 选填，推送邮箱，tsfs为0或2时,此项为必填>,
   *      qdbz: <string: 选填，清单标志:0,根据项目名称数,自动产生清单;1,将项目信息打印至清单, 默认为 0,暂不支持1>,
   *      qdxmmc: <string: 选填，清单项目名称:打印清单时对应发票票面项目名称，qdbz为1是,此项为必填>,
   *      telephone: <string: 选填，购方电话>,
   *      dkbz: <string: 选填，代开标志:0 非代开;1 代开。代开票备注不 为空时,代开蓝票备 注文案要求包含:代 开企业税号:***,代开 企业名称:***;代开 红票备注文案要求: 对应正数发票代 码:***号码:***代开 企业税号:***代开企 业名称:***。>,
   *      detail: <Array: 必填，电子发票明细，最大列表长度:100>,
   *    }
   *
   *    detail内元素格式如下：
   *    {
   *      goodsname: <string: 必填，商品名称，如 FPHXZ=1,则 此商品行为折 扣行,此版本折 扣行不允许多 行折扣,折扣行 必须紧邻被折 扣行,项目名称 必须与被折扣 行一致。>,
   *      num: <string: 选填，数量，冲红时项目数 量为负数>,
   *      hsbz: <string: 必填，单价含税标志,0:不含税,1:含税>,
   *      price: <string: 必填，单价，冲红时为负>,
   *      taxrate: <string: 必填，税率>,
   *      spec: <string: 选填，规格型号>,
   *      unit: <string: 选填，单位>,
   *      spbm: <string: 必填，商品编码，签订免责协议客户可不传入, 由接口进行匹配,如对接口速度敏感的企业, 建议传入该字段>,
   *      zxbm: <string: 选填，自行编码>,
   *      fphxz: <string: 必填，发票行性质，发票行性质:0,正常 行;1,折扣行;2,被折扣 行>,
   *      yhzcbs: <string: 优惠政策标识:0,不使用;1,使用>,
   *      zzstsgl: <string: 选填，增值税特殊管理，当 yhzcbs 为 1 时,此项必填>,
   *      lslbs: <string：选填，零税率标识:空,非零 税率;1,免税;2,不征 税;3,普通零税率>,
   *      kce: <string：选填，扣除额,小数点后两 位。差额征收的发票 目前只支持一行明 细。不含税差额 = 不 含税金额 - 扣除额; 税额 = 不含税差额* 税率。>
   *    }
   * @return {Response}
   */
  postInvoice (param) {
    const payload = {
      identity: this.identity,
      order: param
    }
    const url = this.host + '/shop/buyer/allow/cxfKp/cxfServerKpOrderSync.action'
    const order = this._encrypt(JSON.stringify(payload))
    return axios.post(url, qs.stringify({order}))
  }

  /**
   * 查询发票状态
   * @param orderNos {string|null} 公司订单号
   * @param serviceOrderNos {string|null} 开票请求流水号
   * @return {Response}
   */
  getInvoiceStatus ({orderNos = null, serviceOrderNos = null}) {
    const payload = {
      identity: this.identity
    }
    if (serviceOrderNos) payload['fpqqlsh'] = serviceOrderNos
    else if (orderNos) payload['orderno'] = orderNos
    else throw new TypeError('orderNo, serviceOrderNo 不能同时为空')
    const url = this.host + '/shop/buyer/allow/ecOd/queryElectricKp.action'
    const order = this._encrypt(JSON.stringify(payload))
    return axios.post(url, qs.stringify({order}))
  }
}

module.exports = {
  Client
}
