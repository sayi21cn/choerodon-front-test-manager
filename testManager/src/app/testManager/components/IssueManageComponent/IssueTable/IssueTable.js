
import React, { Component } from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { Spin, Table, Pagination } from 'choerodon-ui';
import { Draggable, Droppable, DragDropContext } from 'react-beautiful-dnd';
import { FormattedMessage } from 'react-intl';
import EmptyBlock from '../EmptyBlock';
import CreateIssueTiny from '../CreateIssueTiny';
import IssueStore from '../../../store/project/IssueManage/IssueStore';

import {
  renderType, renderIssueNum, renderSummary, renderPriority, renderVersions, renderFolder,
  renderComponents, renderLabels, renderAssigned, renderStatus, renderReporter,
} from './tags';
import './IssueTable.scss';
import pic from '../../../assets/问题管理－空.png';

@observer
class IssueTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      firstIndex: null,
      filteredColumns: [],
    };
    this.columns = [
      {
        title: '编号',
        dataIndex: 'issueNum',
        filters: [],
        render: (issueNum, record) => renderIssueNum(issueNum),
      },
      {
        title: '类型',
        dataIndex: 'issueTypeDTO',
        render: (issueTypeDTO, record) => renderType(issueTypeDTO),
      },
      {
        title: '概要',
        dataIndex: 'summary',
        filters: [],
        render: (summary, record) => renderSummary(summary),
      },
      {
        title: '版本',
        dataIndex: 'versionIssueRelDTOList',
        render: (versionIssueRelDTOList, record) => renderVersions(versionIssueRelDTOList),
      },
      {
        title: '文件夹',
        dataIndex: 'folderName',
        render: (folderName, record) => renderFolder(folderName),
      },
      {
        title: '报告人',
        dataIndex: 'reporter',
        render: (assign, record) => {
          const { reporterId, reporterName, reporterImageUrl } = record;
          return renderReporter(reporterId, reporterName, reporterImageUrl);
        },
      },
      {
        title: '优先级',
        dataIndex: 'priorityId',
        filters: props.prioritys.map(priority => ({ text: priority.name, value: priority.id.toString() })),
        filterMultiple: true,
        render: (priorityId, record) => renderPriority(record.priorityDTO),
      },
    ];
  }


  handleColumnFilterChange = ({ selectedKeys }) => {
    this.setState({
      filteredColumns: selectedKeys,
    });
  }


  components = {
    table: () => {
      const table = (
        <table>
          <thead>
            {this.renderThead()}
          </thead>
          <Droppable droppableId="dropTable" isDropDisabled>
            {(provided, snapshot) => (
              <tbody
                ref={provided.innerRef}
              >
                {this.renderTbody(IssueStore.getIssues)}
                {provided.placeholder}
              </tbody>
            )}
          </Droppable>
        </table>
      );
      return (
        <DragDropContext onDragEnd={this.onDragEnd.bind(this)} onDragStart={this.onDragStart}>
          {table}
        </DragDropContext>
      );
    },

  }

  shouldColumnShow = (column) => {
    if (column.title === '' || !column.dataIndex) {
      return true;
    }
    const { filteredColumns } = this.state;
    return filteredColumns.length === 0 ? true : filteredColumns.includes(column.dataIndex);
  }

  renderThead = () => {
    const { columns } = this;
    const Columns = columns.filter(column => this.shouldColumnShow(column));
    const ths = Columns.map(column => (
      <th style={{ flex: column.flex || 1 }}>
        {column.title}
        {' '}
      </th>
    ));
    return (<tr>{ths}</tr>);
  }

  renderTbody(data) {
    const { disabled, selectedIssue } = this.props;
    const draggingTableItems = IssueStore.getDraggingTableItems;
    const { columns } = this;
    const Columns = columns.filter(column => this.shouldColumnShow(column));
    const tds = index => Columns.map((column) => {
      let renderedItem = null;
      const {
        dataIndex, key, flex, render,
      } = column;
      if (render) {
        renderedItem = render(data[index][dataIndex], data[index], index);
      } else {
        renderedItem = data[index][dataIndex];
      }
      return (
        <td style={{ flex: flex || 1 }}>
          {renderedItem}
        </td>
      );
    });
    const rows = data.map((item, index) => (
      disabled
        ? tds(index)
        : (
          this.renderDraggable(item, index, tds(index))
        )
    ));
    return rows;
  }

  renderNarrowIssue(issue) {
    const {
      issueId,
      issueTypeDTO, issueNum, summary, assigneeId, assigneeName, assigneeImageUrl, reporterId,
      reporterName, reporterImageUrl, statusMapDTO, priorityDTO,
      folderName, epicColor, componentIssueRelDTOList, labelIssueRelDTOList,
      versionIssueRelDTOList, creationDate, lastUpdateDate,
    } = issue;
    return (
      <div style={{ 
        borderBottom: '1px solid #eee', padding: '12px 16px', cursor: 'pointer', 
      }}
      >
        <div style={{
          display: 'flex', marginBottom: '5px', width: '100%', flex: 1,
        }}
        >
          {renderType(issueTypeDTO)}
          {renderIssueNum(issueNum)}
          <div className="c7ntest-flex-space" />
          {renderVersions(versionIssueRelDTOList)}
          {renderFolder(folderName)}
          {renderReporter(reporterId, reporterName, reporterImageUrl, true)}
          {renderPriority(priorityDTO)}
        </div>
        <div style={{ display: 'flex' }}>
          {renderSummary(summary)}
        </div>
      </div>
    );
  }

  onDragEnd = (result) => {
    // console.log('end', result);
    IssueStore.setTableDraging(false);
    document.removeEventListener('keydown', this.enterCopy);
    document.removeEventListener('keyup', this.leaveCopy);
  }

  onDragStart = (monitor) => {
    const draggingTableItems = IssueStore.getDraggingTableItems;
    if (draggingTableItems.length < 1 || _.findIndex(draggingTableItems, { issueId: monitor.draggableId }) < 0) {
      const index = monitor.source.index;
      this.setState({
        firstIndex: index,
      });
      IssueStore.setDraggingTableItems([IssueStore.getIssues[index]]);
    }
    IssueStore.setTableDraging(true);
    document.addEventListener('keydown', this.enterCopy);
    document.addEventListener('keyup', this.leaveCopy);
  }

  enterCopy = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.keyCode === 17 || e.keyCode === 93 || e.keyCode === 91 || e.keyCode === 224) {
      const templateCopy = document.getElementById('template_copy').cloneNode(true);
      templateCopy.style.display = 'block';
      // IssueStore.setCopy(true);
      if (this.instance.firstElementChild) {
        this.instance.replaceChild(templateCopy, this.instance.firstElementChild);
      } else {
        this.instance.appendChild(templateCopy);
      }
      // this.instance.innerText = '复制';
    }
  }

  leaveCopy = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    const templateMove = document.getElementById('template_move').cloneNode(true);
    templateMove.style.display = 'block';
    // IssueStore.setCopy(true);

    if (this.instance.firstElementChild) {
      this.instance.replaceChild(templateMove, this.instance.firstElementChild);
    } else {
      this.instance.appendChild(templateMove);
    }
  }

  handleClickIssue(issue, index, e) {
    const { setSelectIssue, setExpand } = this.props;
    const { firstIndex } = this.state;
    // console.log(e.shiftKey, e.ctrlKey, issue, index, firstIndex);
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      if (e.shiftKey) {
        if (firstIndex !== null) {
          const start = Math.min(firstIndex, index);
          const end = Math.max(firstIndex, index);
          // debugger;
          const draggingTableItems = IssueStore.getIssues.slice(start, end + 1);
          // console.log(draggingTableItems);
          IssueStore.setDraggingTableItems(draggingTableItems);
        }
      } else {
        // 是否已经选择
        const old = IssueStore.getDraggingTableItems;
        const hasSelected = _.findIndex(old, { issueId: issue.issueId });

        // 已选择就去除
        if (hasSelected >= 0) {
          old.splice(hasSelected, 1);
        } else {
          old.push(issue);
        }
        // console.log(hasSelected, old);
        IssueStore.setDraggingTableItems(old);
      }
    } else {
      IssueStore.setDraggingTableItems([]);
      setExpand(true);
      setSelectIssue(issue);
    }
    this.setState({
      firstIndex: index,
    });
  }

  renderDraggable = (issue, index, inner) => {
    const { selectedIssue } = this.props;
    const draggingTableItems = IssueStore.getDraggingTableItems;
    return (
      <Draggable key={issue.issueId} draggableId={issue.issueId} index={index} isDragDisabled={issue.typeCode === 'issue_auto_test'}>
        {(provided, snapshotinner) => (
          <tr
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              background: !snapshotinner.isDragging && issue.typeCode !== 'issue_auto_test' && _.find(draggingTableItems, { issueId: issue.issueId }) && 'rgb(235, 242, 249)',
              position: 'relative',
              ...provided.draggableProps.style,
            }}
            onClick={this.handleClickIssue.bind(this, issue, index)}
            className={issue.issueId === selectedIssue.issueId ? 'c7ntest-border-visible c7ntest-table-item' : 'c7ntest-border c7ntest-table-item'}
          >
            {snapshotinner.isDragging
            && (
              <div style={{
                position: 'absolute',
                width: 20,
                height: 20,
                background: 'red',
                textAlign: 'center',
                color: 'white',
                borderRadius: '50%',
                top: 0,
                left: 0,
              }}
              >
                {draggingTableItems.length}
              </div>
            )
          }
            {snapshotinner.isDragging
            && (
              <div className="IssueTable-drag-prompt">
                <div>
                  {'复制或移动测试用例'}
                </div>
                <div> 按下ctrl/command复制</div>
                <div
                  ref={(instance) => { this.instance = instance; }}
                >
                  <div>
                    {'当前状态：'}
                    <span style={{ fontWeight: 500 }}>移动</span>
                  </div>
                </div>
              </div>
            )
          }
            {inner}
          </tr>
        )
      }
      </Draggable>
    );
  }

  renderTable = () => {
    const { expand } = this.props;
    return expand ? (
      <DragDropContext onDragEnd={this.onDragEnd} onDragStart={this.onDragStart}>
        <Droppable droppableId="dropTable" isDropDisabled>
          {(provided, snapshot) => (
            <div ref={provided.innerRef} style={{ display: 'flex', flexDirection: 'column' }}>
              {
                _.slice(IssueStore.getIssues).map((issue, i) => (
                  this.renderDraggable(issue, i, this.renderNarrowIssue(issue))
                ))
              }
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    ) : (
      <div className="c7ntest-issuetable">
        <Table
          filterBar={false}
          columns={this.columns}
          dataSource={IssueStore.getIssues}
          components={this.components}
          onColumnFilterChange={this.handleColumnFilterChange}
          pagination={false}
        />
      </div>
    );
  }

  renderItems = () => {

  }

  handleFilterChange = (pagination, filters, sorter, barFilters) => {
    // 条件变化返回第一页
    IssueStore.setPagination({
      current: 1,
      pageSize: IssueStore.pagination.pageSize,
      total: IssueStore.pagination.total,
    });
    IssueStore.setFilteredInfo(filters);
    IssueStore.setBarFilters(barFilters);
    // window.console.log(pagination, filters, sorter, barFilters[0]);
    if (barFilters === undefined || barFilters.length === 0) {
      IssueStore.setBarFilters(undefined);
    }

    const { statusId, priorityId } = filters;
    const { issueNum, summary } = filters;
    const search = {
      advancedSearchArgs: {
        statusId: statusId || [],
        priorityId: priorityId || [],
      },
      searchArgs: {
        issueNum: issueNum && issueNum.length ? issueNum[0] : barFilters[0],
        summary: summary && summary.length ? summary[0] : '',
      },
    };
    IssueStore.setFilter(search);
    const { current, pageSize } = IssueStore.pagination;
    IssueStore.loadIssues(current - 1, pageSize);
  }

  handlePaginationChange(page, pageSize) {
    IssueStore.loadIssues(page - 1, pageSize);
  }

  handlePaginationShowSizeChange(current, size) {
    IssueStore.loadIssues(current - 1, size);
  }

  render() {
    const {
      expand, selectedIssue, setSelectIssue, setExpand, prioritys, issueStatusList,
    } = this.props;
    return (
      <div>
        <div id="template_copy" style={{ display: 'none' }}>
          {'当前状态：'}
          <span style={{ fontWeight: 500 }}>复制</span>
        </div>
        <div id="template_move" style={{ display: 'none' }}>
          {'当前状态：'}
          <span style={{ fontWeight: 500 }}>移动</span>
        </div>

        <section className="c7ntest-bar">
          <Table
            rowKey={record => record.id}
            columns={this.columns}
            dataSource={[]}
            filterBar
            showHeader={false}
            onChange={this.handleFilterChange}
            onColumnFilterChange={this.handleColumnFilterChange}
            pagination={false}
            filters={IssueStore.barFilters || []}
            filterBarPlaceholder={<FormattedMessage id="issue_filterTestIssue" />}
          />
        </section>
        <section
          className={`c7ntest-table ${this.state.expand ? 'expand-sign' : ''}`}
          style={{
            // paddingRight: this.state.expand ? '0' : '24px',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          {
            IssueStore.issues.length === 0 && !IssueStore.loading ? (
              <EmptyBlock
                style={{ marginTop: 40 }}
                border
                pic={pic}
                title={<FormattedMessage id="issue_noIssueTitle" />}
                des={<FormattedMessage id="issue_noIssueDescription" />}
              />
            ) : (
              <Spin spinning={IssueStore.loading}>
                {this.renderTable()}
              </Spin>
            )
          }
          <div className="c7ntest-backlog-sprintIssue">
            <div
              style={{
                userSelect: 'none',
                background: 'white',
                padding: '12px 0 12px 20px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #e8e8e8',
              }}
            >
              {/* table底部创建用例 */}
              <CreateIssueTiny />
            </div>
          </div>
          {
            IssueStore.issues.length !== 0 ? (
              <div style={{
                display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 16,
              }}
              >
                <Pagination
                  current={IssueStore.pagination.current}
                  defaultCurrent={1}
                  defaultPageSize={10}
                  pageSize={IssueStore.pagination.pageSize}
                  showSizeChanger
                  total={IssueStore.pagination.total}
                  onChange={this.handlePaginationChange.bind(this)}
                  onShowSizeChange={this.handlePaginationShowSizeChange.bind(this)}
                />
              </div>
            ) : null
          }

        </section>
      </div>

    );
  }
}

IssueTable.propTypes = {

};

export default IssueTable;
