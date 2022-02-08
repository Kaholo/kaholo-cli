const axios = require('axios');
const fs = require("fs");
const Configstore = require('configstore');
const pkg = require('../../package.json');
const cli = require("../cli");
const FormData = require('form-data');
const chalk = require('chalk');

class KaholoService {
    httpClinet;
    conf;
    kaholoUrlConfKey = 'auth.kaholoUrl';
    kaholoTokenConfKey = 'auth.token';

    constructor(){
        this.conf = new Configstore(pkg.name);
    }

    get baseUrl(){
        return this.conf.get(this.kaholoUrlConfKey);
    }
    
    set baseUrl(value){
        this.conf.set(this.kaholoUrlConfKey,value);
    }

    get token(){
        return this.conf.get(this.kaholoTokenConfKey);
    }
    
    set token(value){
        this.conf.set(this.kaholoTokenConfKey,value);
    }

    /**
     * 
     * @param {axios.AxiosRequestConfig} options 
     * @returns {axios.AxiosPromise}
     */
    async makeRequest(options){
        this.httpClinet = this.httpClinet || axios.create({
            baseURL: this.baseUrl,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        if (this.token){
            this.httpClinet.defaults.headers.common['Authorization'] = this.token;
        } else if(!options.ignoreAuth){
            return cli.exitWithMessage(`You must be logged in first`);
        }

        return this.httpClinet(options)
    }

    async verifyUrl(){
        try{
            console.log(`Checking url '${this.baseUrl}...'`);
            await this.makeRequest({
                ignoreAuth: true,
                method: 'GET',
                url: '/api/settings'
            })
        } catch (err){
            cli.exitWithMessage(`Could not verify your kaholo URL: '${this.baseUrl}'. Error Code: ${err.code}`);
        }
    }

    async login(email, password){
        try{
            console.log(`Trying to login with email '${email}'...`);
            const result = await this.makeRequest({
                ignoreAuth: true,
                method:'POST',
                url: '/api/auth/login',
                data:{
                    email,
                    password
                }
            });
            this.token = result.headers.authorization;
        } catch (err){
            cli.exitWithMessage(`Could not login. Please make sure your email and password are correct. Error: ${err.response.status} ${err.response.statusText}`);
        }
    }

    logout(){
        if (!this.token && !this.baseUrl){
            cli.exitWithMessage("Alreadyu logged out.",{chalk:chalk.yellow, exitCode:0});
        }
        try{
            console.log('Logging out...');
            this.conf.clear(this.kaholoTokenConfKey);
            this.conf.clear(this.kaholoUrlConfKey);
            cli.success("Successfully logged out");
        } catch (err){
            cli.exitWithMessage(`Failed to clean credentals: ${err.message}`);
        }
    }

    async verifyToken(){
        try{
            console.log(`Verifing authentication...'`);
            await this.makeRequest({
                method:'GET',
                url:'/api/policies'
            })
        } catch (err){
            if (err.response.status === 401){
                cli.exitWithMessage(`Could not verify your token. Please login`);
            }
        }
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