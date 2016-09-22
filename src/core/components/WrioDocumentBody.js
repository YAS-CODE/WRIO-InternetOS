import React from 'react';
import WrioDocument from '../store/WrioDocument.js';
import WrioDocumentActions from '../actions/WrioDocument.js';
import ArticleLists from './ArticleLists';
import ArticleElement from './ArticleElement';
import CreateItemLists from './CreateItemLists';
import CreateCover from './CreateCover';
import {Carousel} from 'react-bootstrap';
import {CarouselItem} from 'react-bootstrap';
import _ from 'lodash';
import UrlMixin from '../mixins/UrlMixin';
import ItemList from '../jsonld/entities/ItemList.js';
import Article from '../jsonld/entities/Article.js';

/*
*  Base class rendering document body
* */

class DocumentBody extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            error: false
        };
        this.oldError = "dummy";
    }

    shouldComponentUpdate() {
        let updIndex = WrioDocument.getUpdateIndex();
        let changed =  updIndex !== this.index;
        let errorChanged = this.state.error != this.oldError;
        // TODO add check for error message
        return changed || errorChanged;
    }

    componentDidMount() {
        this.wrioStore = WrioDocument.listen(this.onDocumentChange.bind(this));
        this.index = 0;
    }

    componentWillUnmount() {
        this.wrioStore();
    }

    onDocumentChange(doc) {
        if (doc.error) {
            this.setState({error: true});
        } else {
            if (this.state.error) {
                this.setState({error: false});
            }
        }
    }

    render() {

        this.index = WrioDocument.getUpdateIndex(); this.oldError = this.state.error;
        var loading = WrioDocument.getLoading();

        if (this.state.error || (loading && loading.error)) {
                return (<div>Error loading page, try again later</div>);
        }

        if (loading === true) {
            return (<img src="https://wrioos.com/Default-WRIO-Theme/img/loading.gif"/>);
        }

        console.log("Document redraw");

        var content = this.getContentByName(UrlMixin.searchToObject(WrioDocument.getUrl()));

        if (content == null) {
            return (<img src="https://wrioos.com/Default-WRIO-Theme/img/loading.gif"/>);
        } else {
            return (
                <article>
                    {content}
                </article>
            );
        }
    }

    componentDidUpdate () {
        WrioDocumentActions.postUpdateHook();
    }

    getContentByName(url) {
        if (url.cover) {
            var data = WrioDocument.getListItem('cover');
            if (!data) {
                return null;
            }
            return this.getCoverList();
        }

        if (typeof url.list === 'undefined') {
            return this.getArticleContents(WrioDocument.getDocument());
        } else {
            var name = url.list.toLowerCase();
            var data = WrioDocument.getListItem(name);
            if (!data) {
                return null;
            }
            if (name === 'cover') {
                return this.getCoverList(data);
            } else {
                return this.getItemList(data);
            }
        }
    }


    getArticleContents(data) {
        return data
            .map(function (element, key) {
                if (element instanceof Article) {
                    return <ArticleElement data={element} key={key}/>;
                }
            });
    }
/*

 */

    getItemList(data) {
        data = data || [];
        return data.filter((o) => o instanceof ItemList)
            .map(function (list) {
                return list.children.map(function (item, key) {
                    return <CreateItemLists data={item} key={key}/>;
                });
            });
    }


    getCoverList(data) {
        var data = _.chain(data)
            .pluck('children')
            .flatten()
            .filter(function (item) {
                return !_.isEmpty(item);
            })
            .map(function (item, key) {
                return (
                    <CarouselItem key={key}><CreateCover data={item} key={key} isActive={key === 0}/></CarouselItem>);
            })
            .value();

        return (
            <Carousel>{data}</Carousel>
        );
    }



}

DocumentBody.propTypes = {};

export default DocumentBody;
