// Error Messages
export enum MESSAGE {
    // Election
    ELECTION_NOT_FOUND = 'Không tìm thấy cuộc bầu cử',
    ELECTION_IS_NOT_ACTIVE = 'Cuộc bầu cử không hoạt động',

    // Election Documents
    ELECTION_DOCUMENT_NOT_FOUND = 'Không tìm thấy tài liệu kỳ bầu cử',
    ELECTION_DOCUMENT_CREATE_SUCCESS = 'Tạo tài liệu kỳ bầu cử thành công',
    ELECTION_DOCUMENT_GET_SUCCESS = 'Lấy danh sách tài liệu theo electionId thành công',
    ELECTION_DOCUMENT_DELETE_SUCCESS = 'Xóa tài liệu theo electionId thành công',
    ELECTION_DOCUMENT_UPDATE_SUCCESS = 'Cập nhật tài liệu theo electionId thành công',

    // User
    USER_NOT_FOUND = 'Không tìm thấy người dùng',
    USER_IS_NOT_FOUND = 'Người dùng không hoạt động',

    // Voter
    VOTER_NOT_FOUND = 'Không tìm thấy cử tri',
    VOTER_IS_NOT_ACTIVE = 'Cử tri không hoạt động',
    VOTER_HAS_NOT_VOTING_RIGHT = 'Cử tri không có quyền bầu cử cho cuộc bầu cử này',


    // Voting Rights
    VOTING_RIGHT_NOT_FOUND = 'Không tìm thấy quyền bầu cử',
    VOTING_RIGHT_NOT_ELIGIBLE = 'Quyền bầu cử không hợp lệ. Cử tri có số cổ phần hoặc số phiếu lớn hơn 0',

    // Ballots
    BALLOT_NOT_FOUND = 'Không tìm thấy phiếu bầu',

    // Results
    RESULT_NOT_FOUND = 'Không tìm thấy kết quả',
    ENTITY_NOT_FOUND = 'Không tìm thấy entity',

    // Election Entities
    ELECTION_ENTITY_NOT_FOUND = 'Không tìm thấy đối tượng tham gia cuộc bầu cử',
    ELECTION_ENTITY_IS_NOT_ACTIVE = 'Đối tượng tham gia cuộc bầu cử không hoạt động',
    ELECTION_TYPE_NOT_FOUND = 'Không tìm thấy loại cuộc bầu cử',
    ELECTION_TYPE_CODE_NOT_FOUND = 'Không tìm thấy loại bầu cử',
    NO_PARTICIPANTS_LINKED = 'Không có người tham gia liên kết với cuộc bầu cử',

    // Participants
    PARTICIPANT_NOT_FOUND = 'Không tìm thấy người tham gia trong cuộc bầu cử',
    PARTICIPANT_ID_DOES_NOT_EXIST = 'ID người tham gia không tồn tại',
    ROLE_NOT_FOUND = 'Không tìm thấy vai trò',

    // Meetings
    MEETING_NOT_FOUND = 'Không tìm thấy cuộc họp',
    MEETING_ATTENDEE_NOT_FOUND = 'Không tìm thấy người tham gia cuộc họp',

    // Delegations
    DELEGATION_NOT_FOUND = 'Không tìm thấy ủy quyền',
    DOCUMENT_IS_NOT_FOUND = 'Không tìm thấy tài liệu',

    // Reports
    REPORT_NOT_FOUND = 'Không tìm thấy báo cáo',

    // Thresholds & Voting Methods
    THRESHOLD_CODE_NOT_FOUND = 'Không tìm thấy mã của ngưỡng thông qua',
    THRESHOLD_NOT_FOUND = 'Ngưỡng thông qua không tồn tại',
    VOTING_METHOD_CODE_NOT_FOUND = 'Không tìm thấy mã của phương thức bầu cử',
    VOTING_METHOD_NOT_FOUND = 'Phương thức bầu cử không tồn tại',


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

    // Success Messages - Voting Rights
    VOTING_RIGHT_CREATE_SUCCESS = 'Tạo quyền bầu cử thành công',
    VOTING_RIGHT_UPDATE_SUCCESS = 'Cập nhật quyền bầu cử thành công',

    // Success Messages - Ballots
    BALLOT_GET_BY_ELECTION_SUCCESS = 'Lấy danh sách phiếu bầu theo cuộc bầu cử thành công',
    BALLOT_GET_ALL_SUCCESS = 'Lấy danh sách phiếu bầu cử thành công',
    BALLOT_GET_BY_ID_SUCCESS = 'Lấy phiếu bầu theo ID thành công',
    BALLOT_CREATE_SUCCESS = 'Tạo phiếu bầu thành công',
    BALLOT_UPDATE_SUCCESS = 'Cập nhật phiếu bầu thành công',

    // Success Messages - Results
    RESULT_GET_BY_VOTER_SUCCESS = 'Lấy danh sách kết quả theo cử tri thành công',
    RESULT_GET_BY_ELECTION_SUCCESS = 'Lấy danh sách kết quả của cuộc bầu cử thành công',
    RESULT_GET_BY_ID_SUCCESS = 'Lấy kết quả theo ID thành công',
    RESULT_CREATE_SUCCESS = 'Tạo kết quả thành công',
    RESULT_UPDATE_SUCCESS = 'Cập nhật kết quả thành công',

    // Success Messages - Reports
    REPORT_CREATE_SUCCESS = 'Tạo báo cáo thành công',
    REPORT_GET_ALL_SUCCESS = 'Lấy danh sách báo cáo thành công',
    REPORT_GET_BY_ID_SUCCESS = 'Lấy báo cáo theo ID thành công',
    REPORT_UPDATE_SUCCESS = 'Cập nhật báo cáo thành công',

    // Success Messages - Elections
    ELECTION_SEARCH_SUCCESS = 'Tìm kiếm kỳ bầu cử thành công',
    ELECTION_GET_BY_ID_SUCCESS = 'Lấy thông tin kỳ bầu cử  thành công',
    ELECTION_UPDATE_SUCCESS = 'Cập nhật kỳ bầu cử thành công',
    ELECTION_DELETE_SUCCESS = 'Xóa kỳ bầu cử thành công',
    
    ELECTION_CREATE_SUCCESS = 'Tạo mới cuộc bầu cử thành công',

    // Success Messages - Roles
    ROLE_GET_ALL_SUCCESS = 'Lấy danh sách vai trò thành công',
    ROLE_GET_BY_ID_SUCCESS = 'Lấy thông tin vai trò theo ID thành công',
    ROLE_CREATE_SUCCESS = 'Tạo vai trò thành công',
    ROLE_UPDATE_SUCCESS = 'Cập nhật vai trò thành công',
    ROLE_DELETE_SUCCESS = 'Xóa vai trò thành công',

    // Success Messages - Delegations
    DELEGATION_GET_BY_ELECTION_SUCCESS = 'Lấy thông tin ủy quyền theo cuộc bầu cử thành công',
    DELEGATION_GET_PENDING_SUCCESS = 'Lấy danh sách ủy quyền cần xác minh',
    DELEGATION_GET_BY_ID_SUCCESS = 'Lấy thông tin ủy quyền theo ID thành công.',
    DELEGATION_CREATE_SUCCESS = 'Tạo ủy quyền thành công',
    DELEGATION_UPDATE_SUCCESS = 'Cập nhật ủy quyền thành công',

    // Success Messages - Meeting Attendees
    MEETING_ATTENDEE_GET_BY_ID_SUCCESS = 'Lấy thông tin người tham gia trong cuộc họp theo ID thành công',
    MEETING_ATTENDEE_GET_ALL_SUCCESS = 'Lấy danh sách người tham gia trong cuộc họp thành công',
    MEETING_ATTENDEE_CREATE_SUCCESS = 'Tạo người tham gia trong cuộc họp thành công',
    MEETING_ATTENDEE_UPDATE_STATUS_SUCCESS = 'Cập nhật trạng thái tham gia cuộc họp thành công',
    MEETING_ATTENDEE_UPDATE_SUCCESS = 'Cập nhật thông tin người tham gia trong cuộc họp thành công',

    // Success Messages - Meetings
    MEETING_CREATE_SUCCESS = 'Tạo cuộc họp thành công',
    MEETING_UPDATE_SUCCESS = 'Cập nhật cuộc họp thành công',

    // Success Messages - Election Participants
    ELECTION_PARTICIPANT_CREATE_SUCCESS = 'Tạo người tham gia cuộc bầu cử thành công',

    // Success Messages - Election Entities
    ELECTION_ENTITY_CREATE_SUCCESS = 'Tạo đối tượng cuộc bầu cử thành công',
    ELECTION_ENTITY_UPDATE_SUCCESS = 'Cập nhật entity cuộc bầu cử thành công',

    // Success Messages - Election Types
    ELECTION_TYPE_GET_BY_CODE_SUCCESS = 'Lấy thông tin loại bầu cử theo mã thành công',

    // Success Messages - Voting Methods
    VOTING_METHOD_GET_BY_CODE_SUCCESS = 'Lấy thông tin phương thức bầu cử theo mã thành công',

    // Success Messages - Thresholds
    THRESHOLD_GET_BY_CODE_SUCCESS = 'Lấy thông tin ngưỡng thông qua theo mã thành công',

    // Success Messages - Delegate Cards
    DELEGATE_CARD_GET_ACTIVE_SUCCESS = 'Lấy danh sách thẻ đại biểu hoặc ủy quyền thành công',

    // Success Messages - System
    SYSTEM_LOG_SEARCH_SUCCESS = 'Tìm kiếm log hệ thống thành công',
}
