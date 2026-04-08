import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";
import Storage "mo:caffeineai-object-storage/Storage";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Set "mo:core/Set";
import Nat "mo:core/Nat";


actor {
  include MixinObjectStorage();

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

  // Admin credentials — session token validated purely by constant comparison
  let ADMIN_PASSWORD = "Kaushal@123";
  let ADMIN_SESSION_TOKEN = "kf-admin-session-2024";

  // Kept for stable variable compatibility with previous deployment
  var adminSessionActive = false;

  // Admin login: verify password and return session token
  public shared func adminLogin(password : Text) : async ?Text {
    if (password == ADMIN_PASSWORD) {
      adminSessionActive := true; // kept for stable var compatibility
      ?ADMIN_SESSION_TOKEN;
    } else {
      null;
    };
  };

  // Verify session token — purely token comparison, survives canister upgrades
  func verifyAdminSession(token : Text) {
    if (token != ADMIN_SESSION_TOKEN) {
      Runtime.trap("Unauthorized");
    };
  };

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

  // file is ExternalBlob: UTF-8 bytes of "!caf!sha256:..." sentinel string
  public shared func uploadMemory(uploaderName : Text, file : Storage.ExternalBlob, fileName : Text) : async () {
    if (uploaderName.size() == 0 or fileName.size() == 0) {
      Runtime.trap("Uploader name and file name are required");
    };

    let blobId = switch (file.decodeUtf8()) {
      case (?text) { text };
      case null { Runtime.trap("Invalid UTF-8 in blob hash") };
    };

    let newEntry : UploadEntry = {
      uploaderName;
      fileName;
      timestamp = Time.now();
      blobId;
    };

    let newEntries = Array.empty<UploadEntry>().concat(uploadEntries).concat([newEntry]);
    uploadEntries := newEntries;
  };

  public shared func deleteUpload(blobId : Text, sessionToken : Text) : async () {
    verifyAdminSession(sessionToken);
    uploadEntries := uploadEntries.filter(func(e : UploadEntry) : Bool { e.blobId != blobId });
  };

  // Delete all uploads at once
  public shared func deleteAllUploads(sessionToken : Text) : async () {
    verifyAdminSession(sessionToken);
    uploadEntries := Array.empty<UploadEntry>();
  };

  // Delete a selected set of uploads by blobId
  public shared func deleteSelectedUploads(blobIds : [Text], sessionToken : Text) : async () {
    verifyAdminSession(sessionToken);
    let blobIdSet = Set.empty<Text>();
    for (id in blobIds.values()) {
      blobIdSet.add(id);
    };
    uploadEntries := uploadEntries.filter(func(e : UploadEntry) : Bool { not blobIdSet.contains(e.blobId) });
  };

  public shared func getAllUploads(sessionToken : Text) : async [UploadEntry] {
    verifyAdminSession(sessionToken);
    uploadEntries;
  };

  public shared func getStats(sessionToken : Text) : async (Nat, Nat) {
    verifyAdminSession(sessionToken);
    let totalUploads = uploadEntries.size();
    let uniqueUploaderNames = Set.empty<Text>();
    for (entry in uploadEntries.values()) {
      uniqueUploaderNames.add(entry.uploaderName);
    };
    (totalUploads, uniqueUploaderNames.size());
  };
};
