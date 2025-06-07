## General Rules
- Commit messages must have a subject line and may have body copy. These must be separated by a blank line.
- The subject line must not exceed 50 characters
- The subject line should be capitalized and must not end in a period
- The subject line must be written in imperative mood (Fix, not Fixed / Fixes etc.)
- The body copy must be wrapped at 72 columns
- The body copy must only contain explanations as to what and why, never how. The latter belongs in documentation and implementation.

## Example
This is an example of a complete commit message that adheres to this standard. Parts of this are optional, so read on.

    Summarize changes in around 50 characters or less

    More detailed explanatory text, if necessary. Wrap it to about 72
    characters or so. In some contexts, the first line is treated as the
    subject of the commit and the rest of the text as the body. The
    blank line separating the summary from the body is critical (unless
    you omit the body entirely); various tools like `log`, `shortlog`
    and `rebase` can get confused if you run the two together.

    Explain the problem that this commit is solving. Focus on why you
    are making this change as opposed to how (the code explains that).
    Are there side effects or other unintuitive consequences of this
    change? Here's the place to explain them.

    Further paragraphs come after blank lines.

    - Bullet points are okay, too

    - Typically a hyphen or asterisk is used for the bullet, preceded
      by a single space, with blank lines in between, but conventions
      vary here

    If you use an issue tracker, put references to them at the bottom,
    like this:

    Resolves: #123
    See also: #456, #789

## Subject and Body
- A body copy is not required for commits that are overly simple. If you find yourself repeating the subject line in the body copy, it's a good sign that the body might be superfluous.

To perform a *simple* commit, a single command if sufficient:

    $ git commit -m"Fix my subject line style"

If you need to write copy, issue `git commit`. Git will now open your default text editor. To set a custom editor, use `git config --global core.editor nano` (in this example, nano is the editor).

Here's an example of a subject and body commit message:

    Derezz the master control program

    MCP turned out to be evil and had become intent on world domination.
    This commit throws Tron's disc into MCP (causing its deresolution)
    and turns it back into a chess game.
  
This makes browsing the git *log* easier:

    $ git log
    commit 42e769bdf4894310333942ffc5a15151222a87be
    Author: Kevin Flynn <kevin@flynnsarcade.com>
    Date:   Fri Jan 01 00:00:00 1982 -0200

    Derezz the master control program

    MCP turned out to be evil and had become intent on world domination.
    This commit throws Tron's disc into MCP (causing its deresolution)
    and turns it back into a chess game.

You can view a shorter log, by restricting the output to the subject lines:

    $ git log --oneline
    42e769 Derezz the master control program

This provied an easy way to get a quick overview by means of reading the shortlog:

    $ git shortlog
    Kevin Flynn (1):
          Derezz the master control program

    Alan Bradley (1):
          Introduce security program "Tron"

    Ed Dillinger (3):
          Rename chess program to "MCP"
          Modify chess program
          Upgrade chess program

    Walter Gibbs (1):
          Introduce protoype chess program

## Use the Imperative
Inkeeping with the standard output of git itself, all commit subject lines must be written using the imperative:

**Good**
- Refactor subsystem X for readability
- Update getting started documentation
- Remove deprecated methods
- Release version 1.0.0
  
**Bad**
- Fixed bug with Y
- Changing behavior of X

**Very Bad**
- More fixes for broken stuff
- Sweet new API methods
- 42

Your commit subject line must be able to complete the sentence
> If applied, this commit will ...

If it doesn't, it's non-conformant. The body may use any style you want.

## Use the Body to Explain the Background and Reasoning, not the Implementation
Especially if the diff is rather large or extremely clustered, you can save all fellow developers some time by explaining why you did what.

Here's a perfect example:

    commit eb0b56b19017ab5c16c745e6da39c53126924ed6
    Author: Pieter Wuille <pieter.wuille@gmail.com>
    Date:   Fri Aug 1 22:57:55 2014 +0200

      Simplify serialize.h's exception handling

      Remove the 'state' and 'exceptmask' from serialize.h's stream
      implementations, as well as related methods.

      As exceptmask always included 'failbit', and setstate was always
      called with bits = failbit, all it did was immediately raise an
      exception. Get rid of those variables, and replace the setstate
      with direct exception throwing (which also removes some dead
      code).

      As a result, good() is never reached after a failure (there are
      only 2 calls, one of which is in tests), and can just be replaced
      by !eof().

      fail(), clear(n) and exceptions() are just never called. Delete
      them.

This is way easier to parse than the corresponding diff.
```diff
---
 src/main.cpp             |  2 +-
 src/serialize.h          | 63 ++++------------------------------------
 src/test/alert_tests.cpp |  2 +-
 3 files changed, 8 insertions(+), 59 deletions(-)

diff --git a/src/main.cpp b/src/main.cpp
index 353cde0bd7cd7..3add3491c8a58 100644
--- a/src/main.cpp
+++ b/src/main.cpp
@@ -3228,7 +3228,7 @@ bool LoadExternalBlockFile(FILE* fileIn, CDiskBlockPos *dbp)
             }
         }
         uint64_t nRewind = blkdat.GetPos();
-        while (blkdat.good() && !blkdat.eof()) {
+        while (!blkdat.eof()) {
             boost::this_thread::interruption_point();
 
             blkdat.SetPos(nRewind);
diff --git a/src/serialize.h b/src/serialize.h
index f876efd9b5a41..748a2a0d4e928 100644
--- a/src/serialize.h
+++ b/src/serialize.h
@@ -870,8 +870,6 @@ class CDataStream
     typedef CSerializeData vector_type;
     vector_type vch;
     unsigned int nReadPos;
-    short state;
-    short exceptmask;
 public:
     int nType;
     int nVersion;
@@ -923,8 +921,6 @@ class CDataStream
         nReadPos = 0;
         nType = nTypeIn;
         nVersion = nVersionIn;
-        state = 0;
-        exceptmask = std::ios::badbit | std::ios::failbit;
     }
 
     CDataStream& operator+=(const CDataStream& b)
@@ -1047,19 +1043,7 @@ class CDataStream
     //
     // Stream subset
     //
-    void setstate(short bits, const char* psz)
-    {
-        state |= bits;
-        if (state & exceptmask)
-            throw std::ios_base::failure(psz);
-    }
-
     bool eof() const             { return size() == 0; }
-    bool fail() const            { return state & (std::ios::badbit | std::ios::failbit); }
-    bool good() const            { return !eof() && (state == 0); }
-    void clear(short n)          { state = n; }  // name conflict with vector clear()
-    short exceptions()           { return exceptmask; }
-    short exceptions(short mask) { short prev = exceptmask; exceptmask = mask; setstate(0, "CDataStream"); return prev; }
     CDataStream* rdbuf()         { return this; }
     int in_avail()               { return size(); }
 
@@ -1079,9 +1063,7 @@ class CDataStream
         {
             if (nReadPosNext > vch.size())
             {
-                setstate(std::ios::failbit, "CDataStream::read() : end of data");
-                memset(pch, 0, nSize);
-                nSize = vch.size() - nReadPos;
+                throw std::ios_base::failure("CDataStream::read() : end of data");
             }
             memcpy(pch, &vch[nReadPos], nSize);
             nReadPos = 0;
@@ -1101,7 +1083,7 @@ class CDataStream
         if (nReadPosNext >= vch.size())
         {
             if (nReadPosNext > vch.size())
-                setstate(std::ios::failbit, "CDataStream::ignore() : end of data");
+                throw std::ios_base::failure("CDataStream::ignore() : end of data");
             nReadPos = 0;
             vch.clear();
             return (*this);
@@ -1174,8 +1156,6 @@ class CAutoFile
 {
 protected:
     FILE* file;
-    short state;
-    short exceptmask;
 public:
     int nType;
     int nVersion;
@@ -1185,8 +1165,6 @@ class CAutoFile
         file = filenew;
         nType = nTypeIn;
         nVersion = nVersionIn;
-        state = 0;
-        exceptmask = std::ios::badbit | std::ios::failbit;
     }
 
     ~CAutoFile()
@@ -1213,19 +1191,6 @@ class CAutoFile
     //
     // Stream subset
     //
-    void setstate(short bits, const char* psz)
-    {
-        state |= bits;
-        if (state & exceptmask)
-            throw std::ios_base::failure(psz);
-    }
-
-    bool fail() const            { return state & (std::ios::badbit | std::ios::failbit); }
-    bool good() const            { return state == 0; }
-    void clear(short n = 0)      { state = n; }
-    short exceptions()           { return exceptmask; }
-    short exceptions(short mask) { short prev = exceptmask; exceptmask = mask; setstate(0, "CAutoFile"); return prev; }
-
     void SetType(int n)          { nType = n; }
     int GetType()                { return nType; }
     void SetVersion(int n)       { nVersion = n; }
@@ -1238,7 +1203,7 @@ class CAutoFile
         if (!file)
             throw std::ios_base::failure("CAutoFile::read : file handle is NULL");
         if (fread(pch, 1, nSize, file) != nSize)
-            setstate(std::ios::failbit, feof(file) ? "CAutoFile::read : end of file" : "CAutoFile::read : fread failed");
+            throw std::ios_base::failure(feof(file) ? "CAutoFile::read : end of file" : "CAutoFile::read : fread failed");
         return (*this);
     }
 
@@ -1247,7 +1212,7 @@ class CAutoFile
         if (!file)
             throw std::ios_base::failure("CAutoFile::write : file handle is NULL");
         if (fwrite(pch, 1, nSize, file) != nSize)
-            setstate(std::ios::failbit, "CAutoFile::write : write failed");
+            throw std::ios_base::failure("CAutoFile::write : write failed");
         return (*this);
     }
 
@@ -1292,16 +1257,7 @@ class CBufferedFile
     uint64_t nRewind;     // how many bytes we guarantee to rewind
     std::vector<char> vchBuf; // the buffer
 
-    short state;
-    short exceptmask;
-
 protected:
-    void setstate(short bits, const char *psz) {
-        state |= bits;
-        if (state & exceptmask)
-            throw std::ios_base::failure(psz);
-    }
-
     // read data from the source to fill the buffer
     bool Fill() {
         unsigned int pos = nSrcPos % vchBuf.size();
@@ -1313,8 +1269,7 @@ class CBufferedFile
             return false;
         size_t read = fread((void*)&vchBuf[pos], 1, readNow, src);
         if (read == 0) {
-            setstate(std::ios_base::failbit, feof(src) ? "CBufferedFile::Fill : end of file" : "CBufferedFile::Fill : fread failed");
-            return false;
+            throw std::ios_base::failure(feof(src) ? "CBufferedFile::Fill : end of file" : "CBufferedFile::Fill : fread failed");
         } else {
             nSrcPos += read;
             return true;
@@ -1327,12 +1282,7 @@ class CBufferedFile
 
     CBufferedFile(FILE *fileIn, uint64_t nBufSize, uint64_t nRewindIn, int nTypeIn, int nVersionIn) :
         src(fileIn), nSrcPos(0), nReadPos(0), nReadLimit((uint64_t)(-1)), nRewind(nRewindIn), vchBuf(nBufSize, 0),
-        state(0), exceptmask(std::ios_base::badbit | std::ios_base::failbit), nType(nTypeIn), nVersion(nVersionIn) {
-    }
-
-    // check whether no error occurred
-    bool good() const {
-        return state == 0;
+        nType(nTypeIn), nVersion(nVersionIn) {
     }
 
     // check whether we're at the end of the source file
@@ -1391,7 +1341,6 @@ class CBufferedFile
         nLongPos = ftell(src);
         nSrcPos = nLongPos;
         nReadPos = nLongPos;
-        state = 0;
         return true;
     }
 
diff --git a/src/test/alert_tests.cpp b/src/test/alert_tests.cpp
index b16f3f7f5780c..e3066a51ab983 100644
--- a/src/test/alert_tests.cpp
+++ b/src/test/alert_tests.cpp
@@ -83,7 +83,7 @@ struct ReadAlerts
         std::vector<unsigned char> vch(alert_tests::alertTests, alert_tests::alertTests + sizeof(alert_tests::alertTests));
         CDataStream stream(vch, SER_DISK, CLIENT_VERSION);
         try {
-            while (stream.good())
+            while (!stream.eof())
             {
                 CAlert alert;
                 stream >> alert;
```