// 测试XML解析函数
function parseXML(xmlString) {
  const result = {}
  const regex = /<(\w+)>(.*?)<\/\1>/g
  let match
  
  while ((match = regex.exec(xmlString)) !== null) {
    let value = match[2]
    // 处理CDATA标签
    if (value.startsWith('<![CDATA[') && value.endsWith(']]>')) {
      value = value.substring(9, value.length - 3)
    }
    result[match[1]] = value
  }
  
  return result
}

// 测试数据（从日志中复制的微信返回数据）
const testXML = `<xml><return_code><![CDATA[SUCCESS]]></return_code>
<return_msg><![CDATA[OK]]></return_msg>
<result_code><![CDATA[SUCCESS]]></result_code>
<mch_id><![CDATA[1723243294]]></mch_id>
<appid><![CDATA[wxb61e3bbcd9bebc43]]></appid>
<nonce_str><![CDATA[TVjeWlrDTKELuTI1]]></nonce_str>
<sign><![CDATA[6E1E98101268CA506BE12027D2ABFC14]]></sign>
<prepay_id><![CDATA[wx081224585467743e335a914635a1560001]]></prepay_id>
<trade_type><![CDATA[JSAPI]]></trade_type>
</xml>`

console.log('=== XML解析测试 ===')
console.log('原始XML:', testXML)

const parsed = parseXML(testXML)
console.log('\n解析结果:', parsed)

console.log('\n=== 关键字段检查 ===')
console.log('return_code:', parsed.return_code)
console.log('result_code:', parsed.result_code)
console.log('prepay_id:', parsed.prepay_id)

console.log('\n=== 条件检查 ===')
console.log('return_code === "SUCCESS":', parsed.return_code === 'SUCCESS')
console.log('result_code === "SUCCESS":', parsed.result_code === 'SUCCESS')

if (parsed.return_code === 'SUCCESS' && parsed.result_code === 'SUCCESS') {
  console.log('✅ 支付参数解析成功，可以生成支付参数')
} else {
  console.log('❌ 支付参数解析失败')
}
