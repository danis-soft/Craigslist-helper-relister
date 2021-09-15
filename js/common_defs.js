export var KEY_ALL_LISTINGS = 'craigslist_relister_renew_listings';
export var KEY_NEVERSHOW_LISTINGS = 'craigslist_relister_nevershow_listings';
export var KEY_CURRENT_LISTING = 'craigslist_relister_current_listing';
export var KEY_COMPLETED_POSTING = "craigslist_relister_completed_posting";

export var message_origin = {
    POPUP : "popup",
    BACKGROUND: "background",
    CONTENT: "content_script"
  };
  
export var message_destination = 
{
  CONTENT: "content",
  BACKGROUND: "background"
};


export const message_type = {
  RENEW: "renew_listing",
  GET_LISTINGS: "get_listings",
  GET_NEVER_SHOW: "get_nevershow_listings",
  CLEAR_NEVER_SHOW_LISTINGS: "clear_nevershown_listings",
  RESET_AND_INTERRUPT_POSTER: "reset_and_interput_poster",
  REPROCESS_LISTINGS: "reprocess_listings"
};
