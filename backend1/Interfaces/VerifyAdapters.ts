export interface IVerifyResult {
    success : boolean,
    status : string,
    message : string
}

export interface IVerifyAdapters {
    verify(data : any, appId : String,transaction : any) : Promise<IVerifyResult>; 
}