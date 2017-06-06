# nuonuo-einvoice
诺诺网电子发票客户端

## 使用方法

```javascript
const {Client} = require('./sdk')

const yourIdentify = '123456'
const useTestEnv = true

// 实例化客户端
const client = new Client(yourIdentify, useTestEnv)

// 创建电子发票
const res = client.postInvoice({
  buyername: 'Tony',
  phone: '15158111111',
  orderno: '1234556',
  invoicedate: '2017-05-27 13:34:12',
  clerk: 'Anna',
  salephone: '15111111111',
  saleaddress: '互联网创新创业园',
  saletaxnum: 'your-tax-num-12312',
  taxtotal: '0.11',
  ordertotal: '1.00',
  bhtaxtotal: '0.89',
  kptype: '1',
  detail: [
    {
      goodsname: '脑子',
      num: '1',
      hsbz: '1',
      price: '1.00',
      taxrate: '0.11',
      spbm: '3070401',
      fphxz: '0'
    }
  ]
})

// 查询开票订单状态
const res = client.getInvoiceStatus({serviceOrderNos: ['your-kpqqlsh-123']})
```
