const axios = require('axios');
const fs = require("fs");
const Configstore = require('configstore');
const pkg = require('../../package.json');
const cli = require("../cli");
const FormData = require('form-data');
const chalk = require('chalk');

class KaholoService {
    httpClient;
    conf;
    kaholoUrlConfKey = 'auth.kaholoUrl';
    kaholoTokenConfKey = 'auth.token';
    kaholoProfilesConfKey = 'auth.profiles';
    kaholoCurrentProfileConfKey = 'auth.currentProfile';

    constructor(){
        this.conf = new Configstore(pkg.name);
    }

    get baseUrl(){
        return this.conf.get(`${this.currentProfile}-${this.kaholoUrlConfKey}`);
    }

    set baseUrl(value){
        this.conf.set(`${this.currentProfile}-${this.kaholoUrlConfKey}`,value);
    }

    get token(){
        return this.conf.get(`${this.currentProfile}-${this.kaholoTokenConfKey}`);
    }

    set token(value){
        this.conf.set(`${this.currentProfile}-${this.kaholoTokenConfKey}`,value);
    }

    get currentProfile(){
        return (this.conf.get(this.kaholoCurrentProfileConfKey) || 'default');
    }

    set currentProfile(value){
        this.conf.set(this.kaholoCurrentProfileConfKey,value);
    }

    /**
     * @returns {(string[])}
     */
    get profiles(){
        let profiles = this.conf.get(this.kaholoProfilesConfKey);
        return (!profiles || !Array.isArray(profiles)) ? [] : profiles;
    }

    set profiles(value){
        this.conf.set(this.kaholoProfilesConfKey,value);
    }

    /**
     *
     * @param {axios.AxiosRequestConfig} options
     * @returns {axios.AxiosPromise}
     */
    async makeRequest(options, tempToken){
        this.httpClient = axios.create({
            baseURL: options.baseURL || this.baseUrl,
            maxContentLength: 100000000,
            maxBodyLength: 100000000,
        });
        
        if(tempToken){
            this.httpClient.defaults.headers.common['Authorization'] = tempToken;
        }
        else if (this.token){
            this.httpClient.defaults.headers.common['Authorization'] = this.token;
        } else if(!options.ignoreAuth){
            return cli.exitWithMessage(`You must be logged in first`);
        }

        return this.httpClient(options)
    }

    async verifyUrl(url){
        try{
            console.log(`Checking url '${url}...'`);
            await this.makeRequest({
                baseURL: url,
                ignoreAuth: true,
                method: 'GET',
                url: '/api/settings'
            });
        } catch (err){
            cli.exitWithMessage(`Could not verify your kaholo URL: '${url}'. Error Code: ${err.code}`);
        }
    }

    async login(url, email, password){
        try{
            console.log(`Trying to login with email '${email}'...`);
            const result = await this.makeRequest({
                baseURL: url,
                ignoreAuth: true,
                method:'POST',
                url: '/api/auth/login',
                data:{
                    email,
                    password
                }
            });
            return result.headers.authorization;
        } catch (err){
            cli.exitWithMessage(`Could not login. Please make sure your email and password are correct. Error: ${err.response.status} ${err.response.statusText}`);
        }
    }

    logout(profile){
        const _tmpCurrentProfile = this.currentProfile;
        
        this.currentProfile = profile;
        
        if(!this.token && !this.baseUrl){
            cli.exitWithMessage(`Alreadyu logged out of profile '${this.currentProfile}'.`,{chalk:chalk.yellow, exitCode:0});
        }
        try{
            console.log('Logging out...');    
            this.token = '';
            this.profiles = this.profiles.filter(p=>p==this.currentProfile)
            
            cli.success(`Successfully logged out of '${this.currentProfile}'`);
            if(_tmpCurrentProfile == this.currentProfile){
                this.currentProfile = undefined;
            } else {
                this.currentProfile = _tmpCurrentProfile;
            }
        } catch (err){
            cli.exitWithMessage(`Failed to clean credentals: ${err.message}`);
        }
    }

    async verifyToken(url, token){
        try{
            console.log(`Verifing authentication...'`);
            await this.makeRequest({
                baseURL: url,
                method:'GET',
                url:'/api/policies'
            },token);
        } catch (err){
            if (err.response.status === 401){
                cli.exitWithMessage(`Could not verify your token. Please login`);
            }
        }
    }

    saveProfile(url, token,profile){
        console.log(`Saving profile '${profile}'`);
        const profiles = this.profiles;
        
        // Add to array only if not exists
        if (!profiles.some(p=>p==profile))
            profiles.push(profile);

        // To make sure it is saved to the config store
        this.profiles = profiles;
        this.currentProfile = profile;
        this.token = token;
        this.baseUrl = url;
        console.log(`Switching to profile '${profile}'`);
    }

    async uploadPlugin(zipFilePath, zipFileName){
        try{
            console.log(`Uploading plugin. Using zip '${zipFileName}'...`);
            const form = new FormData();
            form.append('file', fs.createReadStream(zipFilePath));
            const result = await this.makeRequest({
                method: 'POST',
                url: '/api/plugins/upload',
                data: form,
                headers: form.getHeaders()
            })
            const pluginData = result.data;
            cli.success(`Successfully installed ${pluginData.name}@${pluginData.version}`);
        } catch (err){
            cli.exitWithMessage(`Failed to upload plugin. Error: ${err.code || `${err.response.status} ${err.response.statusText}`}`);
        }
    }
}


module.exports = new KaholoService();
