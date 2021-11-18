// export var KEY_ALL_LISTINGS = 'craigslist_relister_renew_listings';
// export var KEY_NEVERSHOW_LISTINGS = 'craigslist_relister_nevershow_listings';
// export var KEY_CURRENT_LISTING = 'craigslist_relister_current_listing';
// export var KEY_COMPLETED_POSTING = "craigslist_relister_completed_posting";
// export var KEY_LAST_ERROR_DELAY_USED = "craigslist_relister_last_error_delay_used";


export const STORAGE_KEYS = Object.freeze(
  {
    KEY_ALL_LISTINGS: 'craigslist_relister_renew_listings',
    KEY_NEVERSHOW_LISTINGS: 'craigslist_relister_nevershow_listings',
    KEY_CURRENT_LISTING: 'craigslist_relister_current_listing',
    KEY_COMPLETED_POSTING: "craigslist_relister_completed_posting",
    KEY_LAST_ERROR_DELAY_USED: "craigslist_relister_last_error_delay_used",
    KEY_PARAMS: "craigslist_relister_params",
    LOG_ROLLING: "craigslist_log_rolling"

  }
);

export const SAVED_PARAMS = Object.freeze(
  {
    SHOW_DELETED_LISTINGS : "bShowDeletedListings",
    INITIAL_REQUEST: "bInitial"
  }
);
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
  GET_LISTINGS: "get_listings",//excludes deleted listings
  GET_ALL_LISTINGS: "get_all_listings",//get all listings including deleted ones
  GET_NEVER_SHOW: "get_nevershow_listings",
  CLEAR_NEVER_SHOW_LISTINGS: "clear_nevershown_listings",
  RESET_AND_INTERRUPT_POSTER: "reset_and_interput_poster",
  REPROCESS_LISTINGS: "reprocess_listings",
  INITIAL_POPUP_LISTINGS: "initial_popup_listings"
};

export function isProduction()
{
  return process.env.NODE_ENV === 'production';
}

export function isNotProduction()
{
  return !isProduction();
}

export function outputDebugLog(s)
{
  if (!isProduction()) 
    console.log(s);
}

