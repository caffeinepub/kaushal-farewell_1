module {
  type Actor = {
    uploadEntries : [UploadEntry];
  };
  type UploadEntry = {
    uploaderName : Text;
    fileName : Text;
    timestamp : Int;
    blobId : Text;
  };

  public func run(old : Actor) : Actor {
    // No changes needed, just carry over the state.
    old;
  };
};
