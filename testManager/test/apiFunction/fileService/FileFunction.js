/*eslint-disable */
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../Utils');

chai.should();
chai.use(chaiHttp);

let fileFunction = {
    /**
     * 上传文件
     * @param query  ( Example : query ={bucket_name: 'string', file_name: 'string'} )
     * @param formData  ( Example : formData ={file: 'string'} )
     * @returns {*|Promise|PromiseLike<T>|Promise<T>}
     */
    uploadFile: function (query, formData) {
        return chai.request(utils.config.gateway)
            .post(`/zuul/test/v1/projects/${144}/test/case/attachment`)
            .query(query)
            .attach('file', formData.file)
            .set('Authorization', global.user.token)
            .then(function (res) {
                res.should.have.status(200);
                return res;
            }).catch(function(err) {
                console.log(err);
            });
    },
    /**
     * 删除文件
     * @param query  ( Example : query ={bucket_name: 'string', url: 'string'} )
     * @returns {*|Promise|PromiseLike<T>|Promise<T>}
     */
    deleteFile: function (query) {
        return chai.request(utils.config.gateway)
            .delete('/file/v1/files')
            .query(query)
            .set('Authorization', global.user.token)
            .then(function (res) {
                res.should.have.status(200);
                return res;
            }).catch(function(err) {
                console.log(err);
            });
    }
};

module.exports = fileFunction;
