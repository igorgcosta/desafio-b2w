import chai from 'chai'
import should from 'should'
import config from 'config'
import { httpGet } from '../app/services/http'
import ValorPorShow from '../app/models/valor-show'
import Transacao from '../app/models/transacao'
import transacaoDb from '../app/db/transacao'
import { gravarValorShow } from '../app/services/valor-show'
import * as estados from '../app/domain/estados'
import * as passos from '../app/domain/passos'

describe('Testes Unitários de services de Worker Transação para chamadas à API FIGHTERS', () => {
    beforeEach(done => { //Before each test we empty the database
        ValorPorShow.remove({}, err => {
            Transacao.remove({}, err => {
                done()
            })
        })
    })
    
    it("Deve devolver transacao sem alterar seu estado e o passo quando passo não for 'VALOR_SHOW'", done => {
        const transacao = {
            estado: estados.PENDING,
            passo_atual: passos.INGRESSO_SHOW,
            passo_estado: estados.SUCCESS,
        }
        gravarValorShow(transacao)
            .then(transacao => {
                transacao.should.have.property('estado',estados.PENDING)
                transacao.should.have.property('passo_atual',passos.INGRESSO_SHOW)
                done()
            })
    })
    it("Deve devolver transacao sem alterar seu estado e o passo quando passo for 'VALOR_SHOW' e estado não for 'in_process'", done => {
        const transacao = {
            estado: estados.PENDING,
            passo_atual: passos.INGRESSO_SHOW,
            passo_estado: estados.SUCCESS,
        }
        gravarValorShow(transacao)
            .then(transacao => {
                transacao.should.have.property('estado', estados.PENDING)
                transacao.should.have.property('passo_atual', passos.INGRESSO_SHOW)
                done()
            })
    })
    it("Deve gravar VALOR POR SHOW na API FOO quando transacao estiver no passo 'VALOR_SHOW' e estado 'in_process'", done => {
        const transacao = {
            data_compra: '2019-01-01T00:00:00.000Z',
            account_id: 265923,
            id_ingresso: "30",
            id_show: "865387",
            valor: 130,
            estado: estados.IN_PROCESS,
            passo_atual: passos.VALOR_SHOW,
            passo_estado: estados.IN_PROCESS,
        }
        const url = `${config.URI_API_FIGHTERS}?id_show=${transacao.id_show}`
        transacaoDb.salvar(transacao)
            .then(transacao => gravarValorShow(transacao))
            .then(transacao => httpGet(url))
            .then(response => {
                response.should.have.property('body').and.be.a.Object()
                response.body.should.have.property('valor', 130)
                done()
            })
            .catch(err => console.log(err))
    })
    it("Deve mudar transacao para o passo FINALIZACAO após gravar VALOR POR SHOW na api FIGHTERS", done => {
        const transacao = {
            data_compra: '2019-01-01T00:00:00.000Z',
            account_id: 265923,
            id_ingresso: "30",
            id_show: "865387",
            valor: 130,
            estado: estados.IN_PROCESS,
            passo_atual: passos.VALOR_SHOW,
            passo_estado: estados.IN_PROCESS,
        }
        transacaoDb.salvar(transacao)
            .then(transacao => gravarValorShow(transacao))
            .then(transacao => {
                transacao.should.have.property('estado', 'in_process')
                transacao.should.have.property('passo_atual', 'FINALIZACAO')
                transacao.should.have.property('passo_estado', 'in_process')
                done()
            })
            .catch(err => console.log(err))
    })
 })

