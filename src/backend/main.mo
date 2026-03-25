import AccessControl "authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type UserId = Principal;

  type User = {
    id : UserId;
    username : Text;
    isAdmin : Bool;
    resume : Resume;
  };

  type Resume = {
    name : Text;
    email : Text;
    position : Text;
    company : Text;
    workExperiences : [WorkExperienceDetails];
    educations : [EducationDetails];
  };

  type WorkExperienceDetails = {
    company : Text;
    title : Text;
    startDate : Time.Time;
    endDate : ?Time.Time;
    description : Text;
  };

  type EducationDetails = {
    school : Text;
    degree : Text;
    major : Text;
    startDate : Time.Time;
    endDate : ?Time.Time;
  };

  let users = Map.empty<UserId, User>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper function to update the resume
  func updateResume(userId : UserId, newResume : Resume) {
    switch (users.get(userId)) {
      case (?user) {
        let updatedUser = { user with resume = newResume };
        users.add(userId, updatedUser);
      };
      case (null) {};
    };
  };

  // Helper function to get a user's resume
  func getResume(userId : UserId) : ?Resume {
    switch (users.get(userId)) {
      case (?user) { ?user.resume };
      case (null) { null };
    };
  };

  public shared ({ caller }) func addWorkExperience(userId : UserId, workExperience : WorkExperienceDetails) : async () {
    if (caller != userId) {
      Runtime.trap("Permission denied: Only the user can add work experience to their resume");
    };

    switch (users.get(userId)) {
      case (?user) {
        let updatedResume = {
          user.resume with workExperiences = user.resume.workExperiences.concat([workExperience]);
        };
        updateResume(userId, updatedResume);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func addEducation(userId : UserId, education : EducationDetails) : async () {
    if (caller != userId) {
      Runtime.trap("Permission denied: Only the user can add education to their resume");
    };

    switch (users.get(userId)) {
      case (?user) {
        let updatedResume = {
          user.resume with educations = user.resume.educations.concat([education]);
        };
        updateResume(userId, updatedResume);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func getOwnFullResume() : async Resume {
    switch (users.get(caller)) {
      case (?user) { user.resume };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?Resume {
    switch (users.get(caller)) {
      case (?user) { ?user.resume };
      case (null) { null };
    };
  };
};
