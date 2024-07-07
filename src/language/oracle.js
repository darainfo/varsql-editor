const SQL = {
    keywords: ["upsert", "having", "start with", "connect by", "prior", "rownum", "level", "intersect", "minus"],
    dataTypes: ["varchar2", "nchar", "nvarchar2", "nclob", "binary_float", "binary_double", "timestamp with time zone", "timestamp with local time zone", "interval year to month", "interval day to second", "raw", "rowid", "urowid", "xmltype"],
    functions: ["to_date", "to_char", "to_number", "nvl", "decode", "greatest", "least"],
    defaultValues: ["sysdate"],
    etc: ["tablespace", "using index", "using hash", "grant", "revoke", "nextval", "currval"],
};

export default SQL;
