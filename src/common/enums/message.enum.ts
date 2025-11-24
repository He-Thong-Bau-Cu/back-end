// Error Messages
export enum MESSAGE {
  SUCCESS = 'Thành công',
  ERROR = 'Không thành công',
  // Election
  ELECTION_NOT_FOUND = 'Không tìm thấy cuộc bầu cử',
  ELECTION_IS_NOT_ACTIVE = 'Cuộc bầu cử không hoạt động',
  ELECTION_ALREADY_EXISTS = 'Cuộc bầu cử đã tồn tại với tiêu đề và ngày bắt đầu này',
  ELECTION_DATE_INVALID = 'Ngày kết thúc phải sau ngày bắt đầu',
  ELECTION_CREATE_SUCCESS = 'Tạo cuộc bầu cử thành công',
  ELECTION_UPDATE_SUCCESS = 'Cập nhật cuộc bầu cử thành công',
  ELECTION_GET_BY_ID_SUCCESS = 'Lấy thông tin cuộc bầu cử thành công',
  ELECTION_SEARCH_SUCCESS = 'Lấy danh sách cuộc bầu cử thành công',
  ELECTION_DELETE_SUCCESS = 'Xóa cuộc bầu cử thành công',


  // Election Documents
  ELECTION_DOCUMENT_NOT_FOUND = 'Không tìm thấy tài liệu kỳ bầu cử',
  ELECTION_DOCUMENT_CREATE_SUCCESS = 'Tạo tài liệu kỳ bầu cử thành công',
  ELECTION_DOCUMENT_GET_SUCCESS = 'Lấy danh sách tài liệu theo electionId thành công',
  ELECTION_DOCUMENT_DELETE_SUCCESS = 'Xóa tài liệu theo electionId thành công',
  ELECTION_DOCUMENT_UPDATE_SUCCESS = 'Cập nhật tài liệu theo electionId thành công',
  ELECTION_DOCUMENT_GET_BY_CREATED_BY_SUCCESS = 'Lấy danh sách tài liệu theo người tạo thành công',
  ELECTION_DOCUMENT_GET_BY_ID_SUCCESS = 'Lấy thông tin tài liệu kỳ bầu cử theo ID thành công',


  // User
  USER_NOT_FOUND = 'Không tìm thấy người dùng',
  USER_IS_NOT_FOUND = 'Người dùng không hoạt động',
  USER_IS_NOT_ACTIVE = 'Người dùng không hoạt động',
  USER_GET_BY_ID_SUCCESS = 'Lấy thông tin người dùng thành công',
  USER_GET_ALL_SUCCESS = 'Lấy danh sách người dùng thành công',
  USER_CREATE_SUCCESS = 'Tạo người dùng thành công',
  USER_UPDATE_SUCCESS = 'Cập nhật người dùng thành công',
  USER_DELETE_SUCCESS = 'Xóa người dùng thành công',
  USER_GET_NON_VOTER_SUCCESS = 'Lấy danh sách người dùng không phải cử tri thành công',
  USER_GET_NOT_VOTER_PRESIDE_SUCCESS = 'Lấy danh sách người dùng không phải cử tri và chủ tọa thành công',
  USER_SEARCH_SUCCESS = 'Tìm kiếm người dùng thành công',
  USER_EXPORT_SUCCESS = 'Xuất danh sách người dùng thành công',
  USER_IMPORT_SUCCESS = 'Nhập người dùng từ Excel thành công',

  // Voter
  VOTER_NOT_FOUND = 'Không tìm thấy cử tri',
  VOTER_IS_NOT_ACTIVE = 'Cử tri không hoạt động',
  VOTER_HAS_NOT_VOTING_RIGHT = 'Cử tri không có quyền bầu cử cho cuộc bầu cử này',
  VOTER_ALREADY_EXISTS = 'Cử tri đã tồn tại cho cuộc bầu cử và người dùng này',
  VOTER_DELETE_SUCCESS = 'Cử tri được xóa thành công',
  VOTER_GET_BY_ELECTION_SUCCESS = 'Lấy danh sách cử tri theo cuộc bầu cử thành công',
  VOTER_GET_BY_ID_SUCCESS = 'Lấy thông tin cử tri thành công',
  VOTER_DASHBOARD_SUCCESS = 'Lấy thống kê dashboard voter thành công',
  VOTER_UPDATE_STATUS_SUCCESS = 'Cập nhật trạng thái cử tri thành công',
  VOTER_SEARCH_SUCCESS = 'Tìm kiếm cử tri thành công',


  // Voting Rights
  VOTING_RIGHT_NOT_FOUND = 'Không tìm thấy quyền bầu cử',
  VOTING_RIGHT_NOT_ELIGIBLE = 'Quyền bầu cử không hợp lệ. Cử tri có số cổ phần hoặc số phiếu lớn hơn 0',
  VOTING_RIGHT_GET_ALL_SUCCESS = 'Lấy danh sách quyền bầu cử thành công',
  VOTING_RIGHT_GET_BY_ELECTION_SUCCESS = 'Lấy danh sách quyền bầu cử theo ID cuộc bầu cử thành công',
  VOTING_RIGHT_GET_BY_VOTER_SUCCESS = 'Lấy danh sách quyền bầu cử theo ID cử tri thành công',
  VOTING_RIGHT_GET_BY_ID_SUCCESS = 'Lấy thông tin quyền bầu cử thành công',
  VOTING_RIGHT_CREATE_SUCCESS = 'Tạo quyền bầu cử thành công',
  VOTING_RIGHT_UPDATE_SUCCESS = 'Cập nhật quyền bầu cử thành công',
  VOTING_RIGHT_ALREADY_EXISTS = 'Quyền bầu cử đã tồn tại',
  VOTING_RIGHT_DELETE_SUCCESS = 'Xóa quyền bầu cử thành công',


  //Voter Invitations
  VOTER_INVITATION_NOT_FOUND = 'Không tìm thấy lời mời cử tri',
  VOTER_INVITATION_GET_BY_ELECTION_SUCCESS = 'Lấy danh sách lời mời cử tri theo ID cuộc bầu cử thành công',
  VOTER_INVITATION_GET_BY_VOTER_SUCCESS = 'Lấy danh sách lời mời cử tri theo ID cử tri thành công',
  VOTER_INVITATION_GET_BY_ID_SUCCESS = 'Lấy thông tin lời mời cử tri thành công',
  VOTER_INVITATION_CREATE_SUCCESS = 'Tạo lời mời cử tri thành công',
  VOTER_INVITATION_UPDATE_SUCCESS = 'Cập nhật lời mời cử tri thành công',
  VOTER_INVITATION_DELETE_SUCCESS = 'Xóa lời mời cử tri thành công',
  VOTER_INVITATION_INVITED_SUCCESS = 'Xác nhận lời mời cử tri thành công',

  // Ballots
  BALLOT_GET_ALL_SUCCESS = 'Lấy danh sách phiếu bầu cử thành công',
  BALLOT_NOT_FOUND = 'Không tìm thấy phiếu bầu',
  BALLOT_GET_BY_VOTER_SUCCESS = 'Lấy danh sách phiếu bầu theo ID cử tri thành công',
  BALLOT_GET_BY_ELECTION_SUCCESS = 'Lấy danh sách phiếu bầu theo ID cuộc bầu cử thành công',
  BALLOT_GET_BY_ID_SUCCESS = 'Lấy thông tin phiếu bầu thành công',
  BALLOT_CREATE_SUCCESS = 'Tạo phiếu bầu thành công',
  BALLOT_UPDATE_SUCCESS = 'Cập nhật phiếu bầu thành công',
  BALLOT_DELETE_SUCCESS = 'Xóa phiếu bầu thành công',
  BALLOT_STATISTICS_SUCCESS = 'Lấy thống kê phiếu bầu thành công',
  BALLOT_UPDATE_STATUS_SUCCESS = 'Cập nhật trạng thái phiếu bầu thành công',
  BALLOT_VOTE_VALUE_INVALID = "Giá trị phiếu không hợp lệ. Tổng giá trị phiếu phải nhỏ hơn hoặc bằng số phiếu mà cử tri đó có",
  BALLOT_ALREADY_EXISTS = 'Phiếu bầu đã tồn tại cho cuộc bầu cử và cử tri này',
  BALLOT_VOTE_VALUE_GREATER_THAN_ZERO = 'Giá trị phiếu bầu phải lớn hơn 0 hoặc bằng 0',
  BALLOT_SEARCH_SUCCESS = 'Tìm kiếm phiếu bầu thành công',
  BALLOT_GET_BY_VOTER_CAST_SUCCESS = 'Lấy danh sách phiếu bầu cử tri đã bỏ phiếu thành công',
  BALLOT_SIGN_SUCCESS = 'Ký phiếu bầu thành công',
  BALLOT_OTP_VERIFY_SUCCESS = 'Xác minh OTP phiếu bầu thành công',



  // Results
  RESULT_NOT_FOUND = 'Không tìm thấy kết quả',
  RESULT_GET_CUMULATIVE_BY_ELECTION_SUCCESS = 'Lấy thông tin kết quả bầu cử hình thức Cumulative theo cuộc bầu cử thành công',
  RESULT_GET_YES_NO_BY_ELECTION_SUCCESS = 'Lấy thông tin kết quả bầu cử hình thức Yes/No/Abstain theo cuộc bầu cử thành công',
  RESULT_SIGN_SUCCESS = 'Ký kết quả bầu cử thành công',
  RESULT_GET_BY_ID_SUCCESS = 'Lấy kết quả theo ID thành công',
  RESULT_GET_BY_VOTER_SUCCESS = 'Lấy danh sách kết quả theo cử tri thành công',
  RESULT_GET_BY_ELECTION_SUCCESS = 'Lấy danh sách kết quả của cuộc bầu cử thành công',

  RESULT_CREATE_SUCCESS = 'Tạo kết quả thành công',
  RESULT_UPDATE_SUCCESS = 'Cập nhật kết quả thành công',
  RESULT_SEARCH_SUCCESS = 'Tìm kiếm kết quả thành công',
  RESULT_DELETE_SUCCESS = 'Xóa kết quả thành công',
  ENTITY_NOT_FOUND = 'Không tìm thấy entity',

  // Election Entities
  ELECTION_ENTITY_NOT_FOUND = 'Không tìm thấy đối tượng tham gia cuộc bầu cử',
  ELECTION_ENTITY_IS_NOT_ACTIVE = 'Đối tượng tham gia cuộc bầu cử không hoạt động',
  ELECTION_ENTITY_GET_BY_ID_SUCCESS = 'Lấy thông tin đối tượng tham gia cuộc bầu cử thành công',
  ELECTION_ENTITY_GET_BY_ELECTION_SUCCESS = 'Lấy danh sách đối tượng tham gia cuộc bầu cử thành công',
  ELECTION_ENTITY_CREATE_SUCCESS = 'Tạo đối tượng tham gia cuộc bầu cử thành công',
  ELECTION_ENTITY_UPDATE_SUCCESS = 'Cập nhật đối tượng tham gia cuộc bầu cử thành công',
  ELECTION_ENTITY_DELETE_SUCCESS = 'Xóa đối tượng tham gia cuộc bầu cử thành công',

  // Election Types
  ELECTION_TYPE_SEARCH_SUCCESS = 'Tìm kiếm loại cuộc bầu cử thành công',
  ELECTION_TYPE_NOT_FOUND = 'Không tìm thấy loại cuộc bầu cử',
  ELECTION_TYPE_CREATE_SUCCESS = 'Tạo loại bầu cử thành công',
  ELECTION_TYPE_CODE_NOT_FOUND = 'Không tìm thấy loại bầu cử',
  ELECTION_TYPE_UPDATE_SUCCESS = 'Cập nhật loại bầu cử thành công',
  ELECTION_TYPE_DELETE_SUCCESS = 'Xóa loại bầu cử thành công',
  ELECTION_TYPE_GET_BY_ID_SUCCESS = 'Lấy thông tin loại cuộc bầu cử thành công',
  NO_PARTICIPANTS_LINKED = 'Người đề xuất không có trong cuộc bầu cử',


  // Meetings
  MEETING_NOT_FOUND = 'Không tìm thấy cuộc họp',
  MEETING_GET_ID_SUCCESS = "Lấy thông tin cuộc họp theo ID thành công",
  MEETING_GET_SUCCESS = "Lấy danh sách cuộc họp thành công",
  MEETING_CREATE_SUCCESS = "Tạo cuộc họp thành công",
  MEETING_UPDATE_SUCCESS = "Cập nhật cuộc họp thành công",
  MEETING_DELETE_SUCCESS = "Xóa cuộc họp thành công",
  MEETING_GET_BY_ELECTION_SUCCESS = "Lấy danh sách cuộc họp theo cuộc bầu cử thành công",
  MEETING_ALREADY_EXISTS = "Cuộc họp đã tồn tại cho cuộc bầu cử này",
  MEETING_SEARCH_SUCCESS = "Tìm kiếm cuộc họp thành công",



  //meetingAttendees
  MEETING_ATTENDEE_GET_BY_MEETING_ID_SUCCESS = "Lấy danh sách người tham gia trong cuộc họp theo ID cuộc họp thành công",
  MEETING_ATTENDEE_NOT_FOUND = 'Không tìm thấy người tham gia trong cuộc họp',
  MEETING_ATTENDEE_GET_BY_PARTICIPANT_ID_SUCCESS = "Lấy danh sách người tham gia trong cuộc họp theo ID người tham gia thành công",
  MEETING_ATTENDEE_GET_BY_ID_SUCCESS = "Lấy thông tin người tham gia trong cuộc họp theo ID thành công",
  MEETING_ATTENDEE_CREATE_SUCCESS = "Tạo người tham gia trong cuộc họp thành công",
  MEETING_ATTENDEE_UPDATE_SUCCESS = "Cập nhật người tham gia trong cuộc họp thành công",
  MEETING_ATTENDEE_DELETE_SUCCESS = "Xóa người tham gia trong cuộc họp thành công",
  MEETING_ATTENDEE_UPDATE_STATUS_SUCCESS = 'Cập nhật trạng thái tham gia cuộc họp thành công',
  MEETING_ATTENDEE_GET_ALL_SUCCESS = 'Lấy danh sách người tham gia trong cuộc họp thành công',
  MEETING_ATTENDEE_GET_NOT_ATTENDED_BY_ELECTION_ID_SUCCESS = "Lấy danh sách người vắng mặt trong cuộc họp theo cuộc bầu cử thành công",
  MEETING_ATTENDEE_GET_ATTENDED_BY_ELECTION_ID_SUCCESS = "Lấy danh sách người đã tham dự cuộc họp theo cuộc bầu cử thành công",


  // Delegations
  DELEGATION_NOT_FOUND = 'Không tìm thấy ủy quyền',
  DELEGATION_GET_BY_STATUS_SUCCESS = 'Lấy danh sách ủy quyền theo trạng thái thành công',
  DELEGATION_GET_BY_ELECTION_SUCCESS = 'Lấy thông tin ủy quyền theo cuộc bầu cử thành công',
  DELEGATION_GET_PENDING_SUCCESS = 'Lấy danh sách ủy quyền cần xác minh',
  DELEGATION_GET_BY_ID_SUCCESS = 'Lấy thông tin ủy quyền theo ID thành công.',
  DELEGATION_CREATE_SUCCESS = 'Tạo ủy quyền thành công',
  DELEGATION_UPDATE_SUCCESS = 'Cập nhật ủy quyền thành công',
  DELEGATION_DELETE_SUCCESS = 'Xóa ủy quyền thành công',
  DELEGATION_DELEGATOR_FAIL = 'Bạn không thể tự ủy quyền cho chính bạn được',
  DELEGATION_USER_FAIL = 'Tạo người ủy quyền thất bại',
  DELEGATION_GET_BY_DELEGATOR_AND_ELECTION_SUCCESS = 'Lấy thông tin ủy quyền theo ID người ủy quyền và ID cuộc bầu cử thành công',
  DELEGATOR_NOT_FOUND = "Không tìm thấy người ủy quyền",
  DELEGATE_NOT_FOUND = "Không tìm thấy người được ủy quyền",
  DELEGATOR_ALREADY_AUTHORIZED = "Người ủy quyền đã ủy quyền cho người khác cho cuộc bầu cử này",
  DELEGATE_ALREADY_AUTHORIZED = "Người được ủy quyền đã được ủy quyền trong cuộc bầu cử này",
  DELEGATION_GET_BY_DELEGATE_SUCCESS = 'Lấy danh sách ủy quyền theo người được ủy quyền thành công',
  DELEGATION_GET_BY_DELEGATOR_SUCCESS = 'Lấy danh sách ủy quyền theo người ủy quyền thành công',
  DELEGATION_SEARCH_SUCCESS = 'Tim kiếm ủy quyền thành công',
  DELEGATION_GET_BY_STATUS_ACTIVE_SUCCESS = 'Lấy danh sách ủy quyền theo đang hoạt động thành công',
  DELEGATE_INFO_INCOMPLETE = 'Thông tin người được ủy quyền chưa đầy đủ',
  DELEGATE_INFO_CONFLICT = 'Id của người được ủy quyền và thông tin tạm thời của người được ủy quyền không được cùng tồn tại',
  DELEGATION_NOT_PENDING = 'Trạng thái ủy quyền không thể duyệt hoặc từ chối',
  STATISTICS_GET_DELEGATIONS_SUCCESS = 'Lấy thông tin thống kê cho ủy quyền thành công',
  DELEGATE_CANNOT_ADMIN_PRESIDE = 'Người được ủy quyền không thể là quản trị viên hoặc chủ tọa cuộc bầu cử',



  DOCUMENT_IS_NOT_FOUND = 'Không tìm thấy tài liệu',

  // Reports
  REPORT_GET_ALL_SUCCESS = 'Lấy danh sách báo cáo thành công',
  REPORT_NOT_FOUND = 'Không tìm thấy báo cáo',
  REPORT_GET_BY_ELECTION_ID_SUCCESS = 'Lấy báo cáo theo ID cuộc bầu cử thành công',
  REPORT_GET_BY_ID_SUCCESS = 'Lấy báo cáo theo ID thành công',
  REPORT_CREATE_SUCCESS = 'Tạo báo cáo thành công',
  REPORT_UPDATE_SUCCESS = 'Cập nhật báo cáo thành công',

  // Data management / Backups
  BACKUP_SEARCH_SUCCESS = 'Lấy danh sách dữ liệu sao lưu thành công',
  BACKUP_IMPORT_SUCCESS = 'Nhập dữ liệu sao lưu thành công',
  BACKUP_EXPORT_SUCCESS = 'Xuất dữ liệu sao lưu thành công',
  BACKUP_NOT_FOUND = 'Không tìm thấy bản sao lưu dữ liệu',

  // System config
  SYSTEM_CONFIG_CREATE_SUCCESS = 'Tạo cấu hình hệ thống thành công',
  SYSTEM_CONFIG_UPDATE_SUCCESS = 'Cập nhật cấu hình hệ thống thành công',
  SYSTEM_CONFIG_DELETE_SUCCESS = 'Xóa cấu hình hệ thống thành công',
  SYSTEM_CONFIG_GET_ALL_SUCCESS = 'Lấy danh sách cấu hình hệ thống thành công',
  SYSTEM_CONFIG_GET_BY_ID_SUCCESS = 'Lấy cấu hình hệ thống theo ID thành công',
  SYSTEM_CONFIG_ALREADY_EXIST = 'Khoá cấu hình đã tồn tại',
  SYSTEM_CONFIG_NOT_FOUND = 'Không tìm thấy cấu hình hệ thống',

  // System report
  SYSTEM_REPORT_VIEW_SUCCESS = 'Lấy báo cáo hệ thống thành công',
  SYSTEM_REPORT_EXPORT_SUCCESS = 'Xuất báo cáo hệ thống thành công',

  // Thresholds & Voting Methods
  THRESHOLD_CODE_NOT_FOUND = 'Không tìm thấy mã của ngưỡng thông qua',
  THRESHOLD_NOT_FOUND = 'Ngưỡng thông qua không tồn tại',
  THRESHOLD_GET_BY_ID_SUCCESS = 'Lấy thông tin ngưỡng thông qua theo ID thành công',
  THRESHOLD_CREATE_SUCCESS = 'Tạo ngưỡng thông qua thành công',
  THRESHOLD_UPDATE_SUCCESS = 'Cập nhật ngưỡng thông qua thành công',
  THRESHOLD_DELETE_SUCCESS = 'Xóa ngưỡng thông qua thành công',
  THRESHOLD_SEARCH_SUCCESS = 'Tìm kiếm ngưỡng thông qua thành công',

  //voting method
  VOTING_METHOD_SEARCH_SUCCESS = 'Tim kiếm phương thức bầu cử thành công',
  VOTING_METHOD_CODE_NOT_FOUND = 'Không tìm thấy mã của phương thức bầu cử',
  VOTING_METHOD_NOT_FOUND = 'Phương thức bầu cử không tồn tại',
  VOTING_METHOD_CREATE_SUCCESS = 'Tạo phương thức bầu cử thành công',
  VOTING_METHOD_UPDATE_SUCCESS = 'Cập nhật phương thức bầu cử thành công',
  VOTING_METHOD_DELETE_SUCCESS = 'Xóa phương thức bầu cử thành công',
  VOTING_METHOD_GET_BY_ID_SUCCESS = 'Lấy thông tin phương thức bầu cử thành công',
  VOTING_METHOD_GET_BY_CODE_SUCCESS = 'Lấy thông tin phương thức bầu cử thông qua mã thành công',
  VOTING_METHOD_GET_ALL_SUCCESS = 'Lấy danh sách phương thức bầu cử thành công',

  // SMS
  SMS_SEND_ERROR = 'Lỗi không xác định xảy ra khi gửi SMS',

  // Signature
  CANNOT_EXTRACT_KEY_CERT = 'Không thể trích xuất key/cert từ p12',
  DOCX_MISSING_PARTS = 'DOCX thiếu các phần bắt buộc',
  NO_BYTE_RANGE_IN_PDF = 'Không tìm thấy ByteRange trong PDF',
  NO_CONTENTS_IN_PDF = 'Không tìm thấy nội dung trong PDF',
  NO_CERTIFICATE_IN_SIGNATURE = 'Không tìm thấy chứng chỉ trong chữ ký.',

  // CA
  MISSING_SIGNER_OR_PASSWORD = 'Thiếu thông tin người ký hoặc mật khẩu',

  // Signature Controller
  NO_WORD_FILE_UPLOADED = 'Không có file Word (.docx) được tải lên',
  P12_PATH_NOT_FOUND = 'Không tìm thấy đường dẫn .p12 được cung cấp',
  CERT_DIRECTORY_NOT_FOUND = 'Không tìm thấy thư mục chứng chỉ',
  NO_SIGNER_P12_AVAILABLE = 'Không có file .p12 của người ký. Vui lòng sử dụng /ca/issue trước',

  // Success Messages - Voters
  VOTER_CREATE_SUCCESS = 'Tạo cử tri thành công',
  VOTER_UPDATE_SUCCESS = 'Cập nhật cử tri thành công',
  VOTER_GET_ELIGIBLE_SUCCESS = 'Lấy danh sách cử tri đủ điều kiện phát hành phiếu thành công',





  // Success Messages - Results






  // Success Messages - Roles
  ROLE_NOT_FOUND = 'Không tìm thấy vai trò',
  ROLE_GET_ALL_SUCCESS = 'Lấy danh sách vai trò thành công',
  ROLE_GET_BY_ID_SUCCESS = 'Lấy thông tin vai trò theo ID thành công',
  ROLE_CREATE_SUCCESS = 'Tạo vai trò thành công',
  ROLE_UPDATE_SUCCESS = 'Cập nhật vai trò thành công',
  ROLE_DELETE_SUCCESS = 'Xóa vai trò thành công',

  // Success Messages - Delegations






  // Election Participants
  ELECTION_PARTICIPANT_CREATE_SUCCESS = 'Tạo người tham gia cuộc bầu cử thành công',
  ELECTION_PARTICIPANT_NOT_FOUND = 'Không tìm thấy người tham gia',
  ELECTION_PARTICIPANT_GET_BY_ID = 'Lấy thông tin của người tham gia theo ID thành công',
  ELECTION_PARTICIPANT_GET_BY_ELECTION = 'Lấy danh sách người tham gia theo cuộc bầu cử thành công',
  ELECTION_PARTICIPANT_UPDATE_SUCCESS = 'Cập nhật người tham gia thành công',
  ELECTION_PARTICIPANT_GET_BY_USER_SUCCESS = 'Lấy danh sách cuộc bầu cử người dùng tham gia thành công',
  ELECTION_PARTICIPANT_GET_VOTERS_SUCCESS = 'Lấy danh sách participants có role là VOTER thành công',
  ELECTION_PARTICIPANT_ID_DOES_NOT_EXIST = 'ID người tham gia không tồn tại',
  ELECTION_PARTICIPANT_ROLE_NOT_FOUND = 'Không tìm thấy vai trò',
  ELECTION_PARTICIPANT_ALREADY_EXIST = "Người dùng này đã tham gia cuộc bầu cử rồi",
  ELECTION_PARTICIPANT_GET_ACTIVE_BY_ELECTION = 'Lấy danh sách người tham gia đang hoạt động theo cuộc bầu cử thành công',
  ELECTION_PARTICIPANT_DELETE_SUCCESS = 'Xóa người tham gia thành công',




  // Success Messages - Election Types
  ELECTION_TYPE_GET_BY_CODE_SUCCESS = 'Lấy thông tin loại bầu cử theo mã thành công',



  // Success Messages - Thresholds
  THRESHOLD_GET_BY_CODE_SUCCESS = 'Lấy thông tin ngưỡng thông qua theo mã thành công',

  //  Delegate Cards
  DELEGATE_CARD_GET_ACTIVE_SUCCESS = 'Lấy danh sách thẻ đại biểu hoặc ủy quyền thành công',
  DELEGATE_CARD_NOT_FOUND = 'Không tìm thấy thẻ đại biểu hoặc ủy quyền',
  DELEGATE_CARD_GET_BY_ID_SUCCESS = 'Lấy thông tin thẻ đại biểu hoặc ủy quyền theo ID thành công',
  DELEGATE_CARD_GET_BY_ELECTION_SUCCESS = 'Lấy danh sách thẻ đại biểu hoặc ủy quyền theo cuộc bầu cử thành công',
  DELEGATE_CARD_CREATE_SUCCESS = 'Tạo thẻ đại biểu hoặc ủy quyền thành công',
  DELEGATE_CARD_UPDATE_SUCCESS = 'Cập nhật thẻ đại biểu hoặc ủy quyền thành công',
  DELEGATE_CARD_ALREADY_EXISTS = 'Thẻ đại biểu hoặc ủy quyền đã tồn tại',
  DELEGATE_CARD_GENERATE_QR_CODE_SUCCESS = 'Tạo mã QR cho thẻ đại biểu hoặc ủy quyền thành công',
  DELEGATE_CARD_GET_BY_VOTER_SUCCESS = 'Lấy danh sách thẻ đại biểu hoặc ủy quyền theo cử tri thành công',


  DELEGATE_GET_BY_VOTER_SUCCESS = 'Lấy danh sách người đại diện theo cử tri thành công',
  DELEGATE_GET_BY_DELEGATOR_SUCCESS = 'Lấy danh sách người đại diện theo người đại diện thành công',

  // Success Messages - System
  SYSTEM_LOG_SEARCH_SUCCESS = 'Tìm kiếm log hệ thống thành công',


  //statistic
  STATISTICS_GET_DASHBOARD_PRESIDENT_SUCCESS = 'Lấy thông tin thống kê cho chủ tọa thành công',
  STATISTICS_GET_SECRETARY_SUCCESS = 'Lấy thông tin thống kê cho thư ký thành công',
  STATISTICS_GET_ENTITY_SUCCESS = 'Lấy thông tin thống kê cho đối tượng thành công',

  BOARD_VOTING_OVERVIEW_SUCCESS = 'Lấy dữ liệu giám sát bầu cử thành công',
  BOARD_VERIFICATION_SUCCESS = 'Lấy dữ liệu xác minh kết quả thành công',
  BOARD_VERIFICATION_APPROVED = 'Đã xác nhận kết quả bầu cử',
  BOARD_AUDIT_REPORT_SUCCESS = 'Lấy báo cáo kiểm soát hệ thống thành công',
  BOARD_AUDIT_SIGN_SUCCESS = 'Đã ký số báo cáo kiểm soát hệ thống',
}
