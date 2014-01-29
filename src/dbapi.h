/* dbapi.h: header file for the generic edbrowse sql database API */

/* Number of returns may as well be the max number of columns we can manage in edbrowse */
#define NUMRETS MAXTCOLS

#define COLNAMELEN 40		/* length of column or table or database name */
#define NUMCURSORS 8		/* number of open cursors */
#define STRINGLEN 1000		/* longest string in the database */

/* constants to help format dates and times */
#define YEARFIRST 1		/* when printing dates */
#define DTDELIMIT 2		/* delimit datetime fields */
#define DTCRUNCH 4		/* leave off century or seconds */
#define DTAMPM 8		/* print with AM PM notation */

/* null values and isnull macros */
#define nullint 0x7fff0000
#define nulldate nullint
#define nulltime nullint
#define nullmoney nullint
#define nullfloat (0x7fff*65536.0)
#define nullstring ((void*)0)
#define nullchar '\0'

/* null test, for ints and dates and times, not floats or strings or chars */
#define isnull(x) ((x) == nullint)
#define isnotnull(x) ((x) != nullint)
#define isnullstring(s) (!(s) || !*(s))
#define isnotnullstring(s) ((s) && *(s))
#define isnullfloat(x) ((x) == nullfloat)
#define isnotnullfloat(x) ((x) != nullfloat)

/* useful C data types */
/* long and float together */
typedef union {
    long l;
    double f;
    void *ptr;
} LF;

typedef void (*fnptr) ();	/* function pointer */
typedef long date;
typedef long interval;
typedef long money;

#define sql_debug (debugLevel >= 3)
#define sql_debug2 (debugLevel >= 4)
extern const char *sql_debuglog;	/* log of debug prints */
extern const char *sql_database;	/* name of current database */

/* Arrays that hold the return values from a select statement,
fetch, or any other function that has multiple returns. */
extern int rv_numRets;		/* number of returned values */
extern char rv_type[NUMRETS + 1];	/* datatypes of returned values */
extern eb_bool rv_nullable[NUMRETS];	/* can the columns take nulls */
extern char rv_name[NUMRETS + 1][COLNAMELEN];	/* column names */
extern LF rv_data[NUMRETS];	/* the returned values */

/* status variables, set by an SQL statement */
extern int rv_lastStatus;	/* status of last sql_exec command */
extern long rv_vendorStatus;	/* vendor-specific error code */
extern int rv_stmtOffset;	/* offset of syntax error within sql statement */
extern long rv_lastNrows;	/* number of rows affected */
extern long rv_lastSerial;	/* serial number generated by last insert */
extern long rv_lastRowid;	/* rowid generated by last insert */
extern void *rv_blobLoc;	/* point to blob in memory */
extern int rv_blobSize;		/* size of blob fetched */
extern const char *rv_blobFile;
extern eb_bool rv_blobAppend;


/*********************************************************************
The ODBC error codes are strings (somewhat inconvenient),
subject to change, and supernumerous.
In other words, the application usually doesn't require this level of
granularity, except in the error messages, which are all handled by odbc.c.
More often, the application wants to trap an integrity error,
such as a check constraint violation, and abort on anything else.
To this end, we have created our own SQL exception codes, listed below.
By designating a couple of these exception codes,
the application can direct error recovery at a high level.
*********************************************************************/

#define EXCSQLMISC 1		/* miscelaneous SQL errors not covered below */
#define EXCSYNTAX 2		/* syntax error in SQL statement */
#define EXCFILENAME 3		/* this filename cannot be used by SQL */
#define EXCCONVERT 4		/* cannot convert/compare the columns/constants in the SQL statement */
#define EXCSUBSCRIPT 5		/* bad string subscripting */
#define EXCROWIDUSE 6		/* bad use of the rowid pseudo-column */
#define EXCBLOBUSE 7		/* bad use of a blob column */
#define EXCAGGREGATEUSE 8	/* bad use of aggregate operators or columns */
#define EXCVIEWUSE 9		/* bad use of a view */
#define EXCTEMPTABLEUSE 10	/* bad use of a temp table */
#define EXCTRUNCATE 11		/* data truncated, into the database or into local buffers */
#define EXCCROSSDB 12		/* operation cannot cross databases */
#define EXCDBCORRUPT 13		/* database is corrupted, time to panic. */
#define EXCINTERRUPT 14		/* user interrupted the query */
#define EXCNOCONNECT 15		/* error in the connection to the database */
#define EXCNODB 16		/* no database selected */
#define EXCNOTABLE 17		/* no such table */
#define EXCDUPTABLE 18		/* duplicate table */
#define EXCAMBTABLE 19		/* ambiguous table */
#define EXCNOCOLUMN 20		/* no such column */
#define EXCDUPCOLUMN 21		/* duplicate column */
#define EXCAMBCOLUMN 22		/* ambiguous column */
#define EXCNOINDEX 23		/* no index */
#define EXCDUPINDEX 24		/* duplicate index */
#define EXCNOCONSTRAINT 25	/* no constraint */
#define EXCDUPCONSTRAINT 26	/* duplicate constraint */
#define EXCNOSPROC 27		/* no stored procedure */
#define EXCDUPSPROC 28		/* duplicate stored procedure */
#define EXCNOSYNONYM 29		/* no such synonym */
#define EXCDUPSYNONYM 30	/* duplicate synonym */
#define EXCNOKEY 31		/* table has no primary or unique key */
#define EXCDUPKEY 32		/* duplicated primary or unique key */
#define EXCNOCURSOR 33		/* cursor not specified, or not available */
#define EXCDUPCURSOR 34		/* duplicating a cursor */
#define EXCRESOURCE 35		/* engine lacks the resources needed to complete this query */
#define EXCCHECK 36		/* check constrain violated */
#define EXCREFINT 37		/* referential integrity violated */
#define EXCMANAGETRANS 38	/* cannot manage or complete the transaction */
#define EXCLONGTRANS 39		/* long transaction, too much log data generated */
#define EXCNOTINTRANS 40	/* this operation requires a transaction */
#define EXCMANAGEBLOB 41	/* cannot open read write close or otherwise manage a blob */
#define EXCITEMLOCK 42		/* row, table, page, or database is locked, or cannot be locked */
#define EXCNOTNULLCOLUMN 43	/* inserting null into a not null column */
#define EXCPERMISSION 44	/* no permission to modify the database in this way */
#define EXCNOROW 45		/* no current row */
#define EXCMANYROW 46		/* many rows were found where one was expected */
#define EXCUNION 47		/* cannot union select statements together */
#define EXCACTIVE 48		/* an open connection or executing SQL statement prevents this function from running */
#define EXCREMOTE 49		/* could not run SQL or gather data from the remote host */
#define EXCWHERECLAUSE 50	/* where clause is semantically unmanageable */
#define EXCDEADLOCK 51		/* deadlock detected */
#define EXCARGUMENT 52		/* bad argument to ODBC, such as null pointer */
#define EXCUNSUPPORTED 53	/* function or capability or option not supported */
#define EXCTIMEOUT 54		/* timeout before SQL completed */
#define EXCTRACE 55		/* error tracing SQL statements, or leaving audit trails */
#define EXCSERIAL 56		/* bad use of serial column */

/* text descriptions corresponding to our generic SQL error codes */
extern const char *sqlErrorList[];


/*********************************************************************
Function prototypes.
*********************************************************************/

void sql_exclist(const short *list);
void sql_exception(int errnum);
void sql_connect(const char *db, const char *login, const char *pw);
void sql_disconnect(void);
void sql_begTrans(void);
void sql_commitWork(void);
void sql_rollbackWork(void);
void sql_deferConstraints(void);
eb_bool sql_execNF(const char *stmt);
eb_bool sql_exec(const char *stmt, ...);
void retsCopy(eb_bool allstrings, void *first, ...);
eb_bool sql_select(const char *stmt, ...);
eb_bool sql_selectNF(const char *stmt, ...);
int sql_selectOne(const char *stmt, ...);
eb_bool sql_proc(const char *stmt, ...);
int sql_procOne(const char *stmt, ...);
int sql_prepare(const char *stmt, ...);
int sql_prepareScrolling(const char *stmt, ...);
void sql_open(int cid);
int sql_prepOpen(const char *stmt, ...);
void sql_close(int cid);
void sql_free(int cid);
void sql_closeFree(int cid);
eb_bool sql_fetchFirst(int cid, ...);
eb_bool sql_fetchLast(int cid, ...);
eb_bool sql_fetchNext(int cid, ...);
eb_bool sql_fetchPrev(int cid, ...);
eb_bool sql_fetchAbs(int cid, long rownum, ...);
void sql_blobInsert(const char *tabname, const char *colname, int rowid,
   const char *filename, void *offset, int length);
void getPrimaryKey(char *tname, int *part1, int *part2, int *part3, int *part4);

/* sourcefile=dbops.c */
char *lineFormat(const char *line, ...);
char *lineFormatStack(const char *line, LF * argv, va_list * parmv_p);
char *sql_mkunld(char delim);
char *sql_mkinsupd(void);
eb_bool isLeapYear(int year);
date dateEncode(int year, int month, int day);
void dateDecode(date d, int *yp, int *mp, int *dp);
date stringDate(const char *s, eb_bool yearfirst);
char *dateString(date d, int flags);
char *timeString(interval seconds, int flags);
interval stringTime(const char *t);
char *moneyString(money m);
money stringMoney(const char *s);
void syncup_table(const char *table1, const char *table2,
   const char *keycol, const char *otherclause);
