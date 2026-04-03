import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Set "mo:core/Set";
import Nat "mo:core/Nat";

actor {
  include MixinStorage();

  // Initialize authorization state for RBAC
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UploadEntry = {
    uploaderName : Text;
    fileName : Text;
    timestamp : Int;
    blobId : Text;
  };

  module UploadEntry {
    public func compare(e1 : UploadEntry, e2 : UploadEntry) : {
      #less;
      #equal;
      #greater;
    } {
      Text.compare(e1.uploaderName, e2.uploaderName);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  var uploadEntries = Array.empty<UploadEntry>();

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Public upload endpoint - NO authentication required
  public shared ({ caller }) func uploadMemory(uploaderName : Text, file : Storage.ExternalBlob, fileName : Text) : async () {
    if (uploaderName.size() == 0 or fileName.size() == 0) {
      Runtime.trap("Uploader name and file name are required");
    };

    let newEntry : UploadEntry = {
      uploaderName;
      fileName;
      timestamp = Time.now();
      blobId = fileName;
    };

    let newEntries = Array.empty<UploadEntry>().concat(uploadEntries).concat([newEntry]);
    uploadEntries := newEntries;
  };

  // Public endpoint to list all upload entries (protected by frontend password)
  public query func getAllUploads() : async [UploadEntry] {
    uploadEntries;
  };

  // Public endpoint to get stats (protected by frontend password)
  public query func getStats() : async (Nat, Nat) {
    let totalUploads = uploadEntries.size();
    let uniqueUploaderNames = Set.empty<Text>();
    for (entry in uploadEntries.values()) {
      uniqueUploaderNames.add(entry.uploaderName);
    };
    (totalUploads, uniqueUploaderNames.size());
  };
};
