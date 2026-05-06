Kính gửi anh/chị,
VNPAY xin gửi anh/chị thông tin kết nối vào môi trường test của Cổng thanh toán VNPAY:
Xin lưu ý:
Thông tin dưới đây là môi trường Sandbox của VNPAY, sử dụng để kết nối kiểm thử hệ thống. Merchant không sử dụng thông tin này để đưa ra cho khách hàng thanh toán thật.

Merchant cần tạo địa chỉ IPN (server call server) sử dụng cập nhật tình trạng thanh toán (trạng thái thanh toán) cho giao dịch. Merchant cần gửi cho VNPAY URL này.
elastic url: http://luxstayhotel.ap-southeast-1.elasticbeanstalk.com/
Thông tin cấu hình:
Terminal ID / Mã Website (vnp_TmnCode): 8J4D542O

Secret Key / Chuỗi bí mật tạo checksum (vnp_HashSecret): UISRHHCH5SSI1VQ6PZ3HQP1SXZWNCE4A

Url thanh toán môi trường TEST (vnp_Url): https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

Thông tin truy cập Merchant Admin để quản lý giao dịch:
Địa chỉ: https://sandbox.vnpayment.vn/merchantv2/

Tên đăng nhập: phanvanduong1223456@gmail.com

Mật khẩu: (Là mật khẩu nhập tại giao diện đăng ký Merchant môi trường TEST)

Kiểm tra (test case) – IPN URL:
Kịch bản test (SIT): https://sandbox.vnpayment.vn/vnpaygw-sit-testing/user/login

Tên đăng nhập: phanvanduong1223456@gmail.com

Mật khẩu: (Là mật khẩu nhập tại giao diện đăng ký Merchant môi trường TEST)

Tài liệu:
Tài liệu hướng dẫn tích hợp: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html

Code demo tích hợp: https://sandbox.vnpayment.vn/apis/vnpay-demo/code-demo-tích-hợp

Thẻ test:
Ngân hàng	NCB
Số thẻ	9704198526191432198
Tên chủ thẻ	NGUYEN VAN A
Ngày phát hành	07/15
Mật khẩu OTP	123456

Ngoài ra anh/chị có thể dùng thử demo Cổng thanh toán VNPAY tại: https://sandbox.vnpayment.vn/apis/vnpay-demo để có những trải nghiệm đầu tiên khi tích hợp với Cổng thanh toán VNPAYQR.
Cần thêm thông tin, anh/chị có thể trao đổi trực tiếp với em qua thông tin ở phần chữ ký của email này.
Cảm ơn anh/chị.
Mọi thắc mắc và góp ý, xin vui lòng liên hệ với chúng tôi qua:
Email: support.vnpayment@vnpay.vn
Hotline: 1900 55 55 77

Trân trọng,

*Quý khách vui lòng không trả lời email này*

SPRING_DATASOURCE_URL=jdbc:postgresql://hotel-postgres.loca.lt:443/hotel
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=123456

SPRING_DATA_MONGODB_URI=mongodb://hotel-mongo.loca.lt:443/hotel

VNPAY_TMN_CODE=8J4D542O
VNPAY_HASH_SECRET=UISRHHCH5SSI1VQ6PZ3HQP1SXZWNCE4A
VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://luxstayhotel.ap-southeast-1.elasticbeanstalk.com/payment/vnpay-return
VERIFY_EMAIL_BASE_URL=http://luxstayhotel.ap-southeast-1.elasticbeanstalk.com/verify-email