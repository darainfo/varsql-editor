export const keywords = [
    // 데이터 검색 및 조작
    "select",
    "from",
    "where",
    "group by",
    "having",
    "order by",
    "insert",
    "into",
    "values",
    "update",
    "delete",
    "truncate",
    "merge",
    // 데이터 정의
    "create",
    "alter",
    "drop",
    "sequence",
    "index",
    "view",
    "table",
    "table",
    // 조인과 관계
    "join",
    "outer",
    "inner",
    "left",
    "right",
    "full",
    // 집합 연산
    "union",
    "union",
    "all",
    "intersect",
    "except",
    // 조건 처리
    "case",
    "when",
    "then",
    "else",
    "end",
    // null 처리
    "is",
    "null",
    "not",
    // 비교 및 논리 연산자
    "like",
    "in",
    "between",
    "exists",
    "and",
    "or",
    "not",
    // 제약 조건
    "primary",
    "foreign",
    "references",
    "check",
    "constraint",
    "default",
    "key",
    // 트랜잭션 관리
    "commit",
    "rollback",
    "savepoint",
    "begin",
    // 권한 관리
    "grant",
    "revoke",
    // 기타
    "asc",
    "desc",
    "as",
    "on",
    "by",
    "with",
    "limit",
    "offset",
    "set",
    // dbms
    "show",
];

export const builtinFunctions = [
    // 숫자 함수
    "abs",
    "ceil",
    "floor",
    "round",
    "truncate",
    // 문자열 함수
    "concat",
    "substring",
    "upper",
    "lower",
    "left",
    "right",
    "length",
    "trim",
    // 날짜 함수
    "date_add",
    "date_sub",
    "date_diff",
    // 집계 함수
    "avg",
    "count",
    "sum",
    "min",
    "max",
    // 조건 함수
    "coalesce",
    "if",
    "nullif",
    // 형 변환 함수
    "cast",
    "convert",
    // 수학 함수
    "power",
    "sqrt",
    "log",
    "exp",
    // 비교 함수
];

export const dataTypes = [
    "char",
    "varchar",
    "text", // 문자열
    "bit",
    "tinyint",
    "int",
    "integer",
    "smallint",
    "bigint", // 정수
    "long",
    "double",
    "decimal",
    "numeric",
    "float",
    "real", // 소수점 숫자
    "date",
    "time",
    "timestamp",
    "datetime", // 날짜와 시간
    "bool",
    "boolean", // 불리언
    "clob",
    "blob",
    "binary",
    "varbinary", // 이진 데이터
    "array",
    "multiset", // 배열과 다중 집합
];

export const dataTypeDefaultValue = ["current_time", "current_date", "current_timestamp", "true", "false"];
